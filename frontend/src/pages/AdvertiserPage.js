import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Switch, Tag, message, Popconfirm, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined, ReloadOutlined } from '@ant-design/icons';
import { advertiserApi } from '../api';

const AdvertiserPage = () => {
  const [advertisers, setAdvertisers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [editingAdvertiser, setEditingAdvertiser] = useState(null);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState(null);
  const [form] = Form.useForm();
  const [rechargeForm] = Form.useForm();

  useEffect(() => {
    loadAdvertisers();
  }, []);

  const loadAdvertisers = async () => {
    try {
      setLoading(true);
      const response = await advertiserApi.list();
      setAdvertisers(response.data);
    } catch (error) {
      message.error('加载广告主列表失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '账户余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (val) => <span style={{ color: '#3f8600', fontWeight: 'bold' }}>¥{val}</span>,
    },
    {
      title: '总预算',
      dataIndex: 'totalBudget',
      key: 'totalBudget',
      render: (val) => `¥${val}`,
    },
    {
      title: '日预算',
      dataIndex: 'dailyBudget',
      key: 'dailyBudget',
      render: (val) => `¥${val}`,
    },
    {
      title: '总消耗',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (val) => <span style={{ color: '#cf1322' }}>¥{val}</span>,
    },
    {
      title: '今日消耗',
      dataIndex: 'dailySpent',
      key: 'dailySpent',
      render: (val) => <span style={{ color: '#fa8c16' }}>¥{val}</span>,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (val) => (
        <Tag color={val ? 'green' : 'red'}>
          {val ? '正常' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DollarOutlined />}
            onClick={() => handleRecharge(record)}
          >
            充值
          </Button>
        </Space>
      ),
    },
  ];

  const handleEdit = (record) => {
    setEditingAdvertiser(record);
    form.setFieldsValue({
      name: record.name,
      balance: parseFloat(record.balance),
      totalBudget: parseFloat(record.totalBudget),
      dailyBudget: parseFloat(record.dailyBudget),
      isActive: record.isActive,
    });
    setModalVisible(true);
  };

  const handleRecharge = (record) => {
    setSelectedAdvertiser(record);
    rechargeForm.setFieldsValue({
      amount: 0,
    });
    setRechargeModalVisible(true);
  };

  const handleCreate = () => {
    setEditingAdvertiser(null);
    form.setFieldsValue({
      name: '',
      balance: 0,
      totalBudget: 100000,
      dailyBudget: 5000,
      isActive: true,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingAdvertiser) {
        await advertiserApi.update(editingAdvertiser.id, values);
        message.success('更新成功');
      } else {
        await advertiserApi.create(values);
        message.success('创建成功');
      }

      setModalVisible(false);
      loadAdvertisers();
    } catch (error) {
      message.error('操作失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleRechargeSubmit = async () => {
    try {
      const values = await rechargeForm.validateFields();
      setLoading(true);

      await advertiserApi.recharge(selectedAdvertiser.id, values.amount);
      message.success(`充值成功: ¥${values.amount}`);

      setRechargeModalVisible(false);
      loadAdvertisers();
    } catch (error) {
      message.error('充值失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          新建广告主
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadAdvertisers}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      <Table
        dataSource={advertisers}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingAdvertiser ? '编辑广告主' : '新建广告主'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="广告主名称"
            rules={[{ required: true, message: '请输入广告主名称' }]}
          >
            <Input placeholder="请输入广告主名称" />
          </Form.Item>
          <Form.Item
            name="balance"
            label="账户余额（元）"
            rules={[{ required: true, message: '请输入账户余额' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入账户余额"
              min={0}
              precision={2}
            />
          </Form.Item>
          <Form.Item
            name="totalBudget"
            label="总预算（元）"
            rules={[{ required: true, message: '请输入总预算' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入总预算"
              min={0}
              precision={2}
            />
          </Form.Item>
          <Form.Item
            name="dailyBudget"
            label="日预算（元）"
            rules={[{ required: true, message: '请输入日预算' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入日预算"
              min={0}
              precision={2}
            />
          </Form.Item>
          <Form.Item
            name="isActive"
            label="状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="正常" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`为 "${selectedAdvertiser?.name}" 充值`}
        open={rechargeModalVisible}
        onOk={handleRechargeSubmit}
        onCancel={() => setRechargeModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={rechargeForm} layout="vertical">
          <Form.Item
            label="当前余额"
          >
            <span style={{ color: '#3f8600', fontSize: '18px', fontWeight: 'bold' }}>
              ¥{selectedAdvertiser?.balance || 0}
            </span>
          </Form.Item>
          <Form.Item
            name="amount"
            label="充值金额（元）"
            rules={[{ required: true, message: '请输入充值金额' }, { min: 1, message: '充值金额必须大于0' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入充值金额"
              min={1}
              precision={2}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdvertiserPage;
