import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, ReloadOutlined, EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { materialApi, planApi } from '../api';

const { Option } = Select;
const { TextArea } = Input;

const MaterialPage = () => {
  const [materials, setMaterials] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [reviewAction, setReviewAction] = useState(null);
  const [form] = Form.useForm();
  const [reviewForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [materialsRes, plansRes] = await Promise.all([
        materialApi.list(),
        planApi.list(),
      ]);
      setMaterials(materialsRes.data);
      setPlans(plansRes.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'DRAFT': { color: 'default', text: '草稿' },
      'PENDING_REVIEW': { color: 'orange', text: '待审核' },
      'APPROVED': { color: 'green', text: '审核通过' },
      'REJECTED': { color: 'red', text: '已拒绝' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '素材名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '所属计划',
      dataIndex: 'planId',
      key: 'planId',
      render: (id) => {
        const plan = plans.find(p => p.id === id);
        return plan?.name || id;
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeMap = {
          'IMAGE': <Tag color="blue">图片</Tag>,
          'VIDEO': <Tag color="purple">视频</Tag>,
          'TEXT': <Tag color="gold">文字</Tag>,
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: '审核意见',
      dataIndex: 'reviewComment',
      key: 'reviewComment',
      render: (comment) => comment || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'DRAFT' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleSubmitReview(record)}
            >
              提交审核
            </Button>
          )}
          {record.status === 'PENDING_REVIEW' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record)}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleReject(record)}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const handleSubmitReview = async (record) => {
    try {
      setLoading(true);
      await materialApi.submitReview(record.id);
      message.success('提交审核成功');
      loadData();
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (record) => {
    setSelectedMaterial(record);
    setReviewAction('approve');
    reviewForm.setFieldsValue({ comment: '' });
    setReviewModalVisible(true);
  };

  const handleReject = (record) => {
    setSelectedMaterial(record);
    setReviewAction('reject');
    reviewForm.setFieldsValue({ comment: '' });
    setReviewModalVisible(true);
  };

  const handleCreate = () => {
    form.setFieldsValue({
      name: '',
      type: 'IMAGE',
      title: '',
      description: '',
      contentUrl: '',
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await materialApi.create(values);
      message.success('创建成功');
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    try {
      const values = await reviewForm.validateFields();
      setLoading(true);

      if (reviewAction === 'approve') {
        await materialApi.approve(selectedMaterial.id, values.comment);
        message.success('审核通过');
      } else {
        await materialApi.reject(selectedMaterial.id, values.comment);
        message.success('已拒绝');
      }

      setReviewModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#666', margin: 0 }}>
            <Tag color="orange">重要</Tag> 素材必须审核通过后才能投放
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            新建素材
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadData}
            loading={loading}
          >
            刷新
          </Button>
        </div>
      </div>

      <Table
        dataSource={materials}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新建广告素材"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="素材名称"
            rules={[{ required: true, message: '请输入素材名称' }]}
          >
            <Input placeholder="请输入素材名称" />
          </Form.Item>
          <Form.Item
            name="planId"
            label="所属计划"
            rules={[{ required: true, message: '请选择所属计划' }]}
          >
            <Select placeholder="请选择所属计划">
              {plans.map(plan => (
                <Option key={plan.id} value={plan.id}>{plan.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="type"
            label="素材类型"
            rules={[{ required: true, message: '请选择素材类型' }]}
          >
            <Select placeholder="请选择素材类型">
              <Option value="IMAGE">图片</Option>
              <Option value="VIDEO">视频</Option>
              <Option value="TEXT">文字</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="广告标题"
            rules={[{ required: true, message: '请输入广告标题' }]}
          >
            <Input placeholder="请输入广告标题" />
          </Form.Item>
          <Form.Item
            name="description"
            label="广告描述"
          >
            <TextArea rows={3} placeholder="请输入广告描述" />
          </Form.Item>
          <Form.Item
            name="contentUrl"
            label="素材地址"
          >
            <Input placeholder="请输入素材URL" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={reviewAction === 'approve' ? '审核通过' : '审核拒绝'}
        open={reviewModalVisible}
        onOk={handleReviewSubmit}
        onCancel={() => setReviewModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item
            label="素材信息"
          >
            <p>素材名称: {selectedMaterial?.name}</p>
            <p>当前状态: {getStatusTag(selectedMaterial?.status)}</p>
          </Form.Item>
          <Form.Item
            name="comment"
            label={reviewAction === 'reject' ? '拒绝原因' : '审核意见'}
            rules={reviewAction === 'reject' ? [{ required: true, message: '请输入拒绝原因' }] : []}
          >
            <TextArea
              rows={3}
              placeholder={reviewAction === 'reject' ? '请输入拒绝原因' : '请输入审核意见（可选）'}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MaterialPage;
