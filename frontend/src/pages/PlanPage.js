import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Tag, message, Space, Descriptions, Card } from 'antd';
import { PlusOutlined, EditOutlined, PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { planApi, advertiserApi, materialApi } from '../api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const PlanPage = () => {
  const [plans, setPlans] = useState([]);
  const [advertisers, setAdvertisers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [plansResponse, advertisersResponse] = await Promise.all([
        planApi.list(),
        advertiserApi.list()
      ]);
      setPlans(plansResponse.data);
      setAdvertisers(advertisersResponse.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await planApi.list();
      setPlans(response.data);
    } catch (error) {
      message.error('加载计划列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'DRAFT': { color: 'default', text: '草稿' },
      'PENDING_REVIEW': { color: 'orange', text: '待审核' },
      'ACTIVE': { color: 'green', text: '投放中' },
      'PAUSED': { color: 'gold', text: '已暂停' },
      'BUDGET_EXHAUSTED': { color: 'red', text: '预算耗尽' },
      'ACCOUNT_ARREARS': { color: 'red', text: '账户欠费' },
      'FINISHED': { color: 'gray', text: '已结束' },
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
      title: '计划名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '广告主',
      dataIndex: 'advertiserId',
      key: 'advertiserId',
      render: (id) => {
        const ad = advertisers.find(a => a.id === id);
        return ad?.name || id;
      },
    },
    {
      title: '出价',
      dataIndex: 'bidPrice',
      key: 'bidPrice',
      render: (val) => `¥${val}/次`,
    },
    {
      title: '日预算',
      dataIndex: 'dailyBudget',
      key: 'dailyBudget',
      render: (val, record) => (
        <div>
          <div>¥{val}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            已消耗: ¥{record.dailySpent}
          </div>
        </div>
      ),
    },
    {
      title: '总预算',
      dataIndex: 'totalBudget',
      key: 'totalBudget',
      render: (val, record) => (
        <div>
          <div>¥{val}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            已消耗: ¥{record.totalSpent}
          </div>
        </div>
      ),
    },
    {
      title: '投放时间',
      key: 'time',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '12px' }}>开始: {record.startDate}</div>
          <div style={{ fontSize: '12px' }}>结束: {record.endDate}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.status === 'ACTIVE' && (
            <Button
              type="link"
              size="small"
              danger
              icon={<PauseCircleOutlined />}
              onClick={() => handlePause(record)}
            >
              暂停
            </Button>
          )}
          {record.status === 'PAUSED' && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStart(record)}
            >
              启动
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleViewDetail = async (record) => {
    setSelectedPlan(record);
    try {
      const response = await materialApi.getByPlan(record.id);
      setMaterials(response.data);
    } catch (error) {
      setMaterials([]);
    }
    setDetailVisible(true);
  };

  const handleEdit = (record) => {
    setEditingPlan(record);
    form.setFieldsValue({
      name: record.name,
      advertiserId: record.advertiserId,
      bidPrice: parseFloat(record.bidPrice),
      dailyBudget: parseFloat(record.dailyBudget),
      totalBudget: parseFloat(record.totalBudget),
      dateRange: [dayjs(record.startDate), dayjs(record.endDate)],
      targetGenders: record.targetGenders,
      targetAgeRanges: record.targetAgeRanges?.map(String),
      targetRegions: record.targetRegions,
      targetInterests: record.targetInterests,
    });
    setModalVisible(true);
  };

  const handleCreate = () => {
    setEditingPlan(null);
    form.setFieldsValue({
      name: '',
      bidPrice: 2.0,
      dailyBudget: 1000,
      totalBudget: 10000,
      targetGenders: ['MALE', 'FEMALE'],
      targetAgeRanges: ['18', '25', '35', '45'],
    });
    setModalVisible(true);
  };

  const handleStart = async (record) => {
    try {
      setLoading(true);
      await planApi.start(record.id);
      message.success('计划启动成功');
      loadPlans();
    } catch (error) {
      message.error('启动失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (record) => {
    try {
      setLoading(true);
      await planApi.pause(record.id);
      message.success('计划暂停成功');
      loadPlans();
    } catch (error) {
      message.error('暂停失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const planData = {
        ...values,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        targetAgeRanges: values.targetAgeRanges?.map(Number),
      };
      delete planData.dateRange;

      if (editingPlan) {
        await planApi.update(editingPlan.id, planData);
        message.success('更新成功');
      } else {
        await planApi.create(planData);
        message.success('创建成功');
      }

      setModalVisible(false);
      loadPlans();
    } catch (error) {
      message.error('操作失败: ' + (error.message || '未知错误'));
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
          新建计划
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadAllData}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      <Table
        dataSource={plans}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingPlan ? '编辑广告计划' : '新建广告计划'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="计划名称"
            rules={[{ required: true, message: '请输入计划名称' }]}
          >
            <Input placeholder="请输入计划名称" />
          </Form.Item>
          {!editingPlan && (
            <Form.Item
              name="advertiserId"
              label="所属广告主"
              rules={[{ required: true, message: '请选择广告主' }]}
            >
              <Select placeholder="请选择广告主">
                {advertisers.map(ad => (
                  <Option key={ad.id} value={ad.id}>{ad.name}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item
            name="dateRange"
            label="投放时间"
            rules={[{ required: true, message: '请选择投放时间' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="bidPrice"
            label="出价（元/次）"
            rules={[{ required: true, message: '请输入出价' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入出价"
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
            name="targetGenders"
            label="定向性别"
          >
            <Select mode="multiple" placeholder="请选择定向性别">
              <Option value="MALE">男性</Option>
              <Option value="FEMALE">女性</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="targetAgeRanges"
            label="定向年龄段"
          >
            <Select mode="multiple" placeholder="请选择定向年龄段">
              <Option value="18">18岁以下</Option>
              <Option value="18">18-24岁</Option>
              <Option value="25">25-34岁</Option>
              <Option value="35">35-44岁</Option>
              <Option value="45">45岁以上</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="targetRegions"
            label="定向地区"
          >
            <Select mode="tags" placeholder="请输入定向地区，如：北京、上海">
            </Select>
          </Form.Item>
          <Form.Item
            name="targetInterests"
            label="定向兴趣"
          >
            <Select mode="tags" placeholder="请输入定向兴趣，如：科技、购物">
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="计划详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedPlan && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="计划名称">{selectedPlan.name}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(selectedPlan.status)}</Descriptions.Item>
              <Descriptions.Item label="出价">¥{selectedPlan.bidPrice}/次</Descriptions.Item>
              <Descriptions.Item label="日预算">¥{selectedPlan.dailyBudget}</Descriptions.Item>
              <Descriptions.Item label="今日消耗">¥{selectedPlan.dailySpent}</Descriptions.Item>
              <Descriptions.Item label="总预算">¥{selectedPlan.totalBudget}</Descriptions.Item>
              <Descriptions.Item label="总消耗">¥{selectedPlan.totalSpent}</Descriptions.Item>
              <Descriptions.Item label="投放时间">{selectedPlan.startDate} ~ {selectedPlan.endDate}</Descriptions.Item>
              <Descriptions.Item label="定向性别" span={2}>{selectedPlan.targetGenders?.join(', ') || '不限'}</Descriptions.Item>
              <Descriptions.Item label="定向地区" span={2}>{selectedPlan.targetRegions?.join(', ') || '不限'}</Descriptions.Item>
              <Descriptions.Item label="定向兴趣" span={2}>{selectedPlan.targetInterests?.join(', ') || '不限'}</Descriptions.Item>
            </Descriptions>

            <Card title="关联素材" style={{ marginTop: '16px' }}>
              {materials.length > 0 ? (
                <Table
                  dataSource={materials}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'ID', dataIndex: 'id', width: 80 },
                    { title: '素材名称', dataIndex: 'name' },
                    { title: '类型', dataIndex: 'type' },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      render: (status) => {
                        const map = {
                          'DRAFT': <Tag>草稿</Tag>,
                          'PENDING_REVIEW': <Tag color="orange">待审核</Tag>,
                          'APPROVED': <Tag color="green">审核通过</Tag>,
                          'REJECTED': <Tag color="red">已拒绝</Tag>,
                        };
                        return map[status] || status;
                      },
                    },
                  ]}
                />
              ) : (
                <p style={{ color: '#999' }}>暂无关联素材</p>
              )}
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PlanPage;
