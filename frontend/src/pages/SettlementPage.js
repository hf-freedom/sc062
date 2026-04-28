import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Tag, message, DatePicker, Alert, Descriptions, Select } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, FileTextOutlined, WarningOutlined } from '@ant-design/icons';
import { settlementApi, advertiserApi } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const SettlementPage = ({ advertisers }) => {
  const [loading, setLoading] = useState(false);
  const [settlements, setSettlements] = useState([]);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState(null);
  const [settlementDate, setSettlementDate] = useState(dayjs().subtract(1, 'day'));
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [adjustmentForm] = Form.useForm();

  useEffect(() => {
    loadSettlements();
  }, [selectedAdvertiser]);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      if (selectedAdvertiser) {
        const response = await settlementApi.getByAdvertiser(selectedAdvertiser);
        setSettlements(response.data);
      } else {
        setSettlements([]);
      }
    } catch (error) {
      message.error('加载结算记录失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'PENDING': { color: 'orange', text: '待确认' },
      'SETTLED': { color: 'green', text: '已结算' },
      'ADJUSTED': { color: 'purple', text: '已调整' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: '结算单号',
      dataIndex: 'settlementNo',
      key: 'settlementNo',
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
      title: '结算日期',
      dataIndex: 'settlementDate',
      key: 'settlementDate',
    },
    {
      title: '曝光量',
      dataIndex: 'impressionCount',
      key: 'impressionCount',
    },
    {
      title: '点击量',
      dataIndex: 'clickCount',
      key: 'clickCount',
    },
    {
      title: '转化量',
      dataIndex: 'conversionCount',
      key: 'conversionCount',
    },
    {
      title: '总消耗',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (val) => `¥${val}`,
    },
    {
      title: '退款金额',
      dataIndex: 'refundAmount',
      key: 'refundAmount',
      render: (val) => <Tag color="green">¥{val}</Tag>,
    },
    {
      title: '最终金额',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      render: (val) => <span style={{ fontWeight: 'bold' }}>¥{val}</span>,
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
        <div style={{ display: 'flex', gap: '8px' }}>
          {record.status === 'PENDING' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleConfirmSettlement(record)}
            >
              确认结算
            </Button>
          )}
          {(record.status === 'SETTLED' || record.status === 'ADJUSTED') && (
            <Button
              type="link"
              size="small"
              danger
              onClick={() => handleCreateAdjustment(record)}
            >
              生成调整单
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleRunSettlement = async () => {
    try {
      setLoading(true);
      await settlementApi.runSettlement(settlementDate.format('YYYY-MM-DD'));
      message.success('结算执行成功');
      if (selectedAdvertiser) {
        loadSettlements();
      }
    } catch (error) {
      message.error('执行结算失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSettlement = async (record) => {
    try {
      setLoading(true);
      await settlementApi.confirmSettlement(record.id);
      message.success('结算确认成功');
      loadSettlements();
    } catch (error) {
      message.error('确认结算失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdjustment = (record) => {
    setSelectedSettlement(record);
    adjustmentForm.setFieldsValue({
      reason: '',
      adjustmentAmount: 0,
      operator: 'ADMIN',
    });
    setAdjustmentModalVisible(true);
  };

  const handleAdjustmentSubmit = async () => {
    try {
      const values = await adjustmentForm.validateFields();
      setLoading(true);

      await settlementApi.createAdjustment(selectedSettlement.id, {
        reason: values.reason,
        adjustmentAmount: values.adjustmentAmount,
        operator: values.operator,
      });

      message.success('调整单创建成功，已结算报表已通过调整单修改');
      setAdjustmentModalVisible(false);
      loadSettlements();
    } catch (error) {
      message.error('创建调整单失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert
        message="结算规则说明"
        description={
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>系统每天凌晨2点自动执行前一天的结算</li>
            <li>结算状态：待确认 → 已确认 → 已调整</li>
            <li><strong>已结算的报表不能修改，只能生成调整单</strong></li>
            <li>调整单会直接影响广告主账户余额</li>
          </ul>
        }
        type="warning"
        showIcon
        style={{ marginBottom: '16px' }}
      />

      <Card title="结算操作">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
          <span>选择广告主：</span>
          <Select
            style={{ width: 200 }}
            placeholder="请选择广告主"
            value={selectedAdvertiser}
            onChange={(value) => setSelectedAdvertiser(value)}
            allowClear
          >
            {advertisers.map(ad => (
              <Option key={ad.id} value={ad.id}>{ad.name}</Option>
            ))}
          </Select>
          <span>结算日期：</span>
          <DatePicker
            value={settlementDate}
            onChange={(date) => setSettlementDate(date)}
          />
          <Button
            type="primary"
            onClick={handleRunSettlement}
            loading={loading}
          >
            执行结算
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadSettlements}
            loading={loading}
          >
            刷新
          </Button>
        </div>

        <Table
          dataSource={settlements}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="生成调整单（修改已结算报表）"
        open={adjustmentModalVisible}
        onOk={handleAdjustmentSubmit}
        onCancel={() => setAdjustmentModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        {selectedSettlement && (
          <div>
            <Alert
              message="已结算报表不能直接修改，只能通过生成调整单来调整金额"
              type="warning"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            <Descriptions bordered column={2} size="small" style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="结算单号">{selectedSettlement.settlementNo}</Descriptions.Item>
              <Descriptions.Item label="结算日期">{selectedSettlement.settlementDate}</Descriptions.Item>
              <Descriptions.Item label="当前状态">{getStatusTag(selectedSettlement.status)}</Descriptions.Item>
              <Descriptions.Item label="最终金额">¥{selectedSettlement.finalAmount}</Descriptions.Item>
            </Descriptions>
            <Form form={adjustmentForm} layout="vertical">
              <Form.Item
                name="adjustmentAmount"
                label="调整金额"
                rules={[{ required: true, message: '请输入调整金额' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="正数为增加余额，负数为扣减余额"
                  precision={2}
                  addonAfter="元"
                />
              </Form.Item>
              <Form.Item
                name="reason"
                label="调整原因"
                rules={[{ required: true, message: '请输入调整原因' }]}
              >
                <TextArea rows={3} placeholder="请输入调整原因" />
              </Form.Item>
              <Form.Item
                name="operator"
                label="操作人"
                rules={[{ required: true, message: '请输入操作人' }]}
              >
                <Input placeholder="请输入操作人" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SettlementPage;
