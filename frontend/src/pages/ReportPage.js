import React, { useState, useEffect } from 'react';
import { Card, Table, Button, DatePicker, Descriptions, Tag, message, Row, Col, Statistic, Alert } from 'antd';
import { ReloadOutlined, FileTextOutlined, EyeOutlined, ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { reportApi, planApi } from '../api';
import dayjs from 'dayjs';

const ReportPage = ({ advertisers }) => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [dailySummary, setDailySummary] = useState(null);
  const [plans, setPlans] = useState([]);
  const [balanceSummary, setBalanceSummary] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryRes, balanceRes, plansRes] = await Promise.all([
        reportApi.getDailySummary(selectedDate.format('YYYY-MM-DD')),
        reportApi.getBalanceSummary(),
        planApi.list(),
      ]);
      setDailySummary(summaryRes.data);
      setBalanceSummary(balanceRes.data);
      setPlans(plansRes.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '曝光量',
      dataIndex: 'impressions',
      key: 'impressions',
    },
    {
      title: '有效点击',
      dataIndex: 'validClicks',
      key: 'validClicks',
    },
    {
      title: '作弊点击',
      dataIndex: 'fraudClicks',
      key: 'fraudClicks',
      render: (val) => <Tag color="red">{val}</Tag>,
    },
    {
      title: '转化量',
      dataIndex: 'conversions',
      key: 'conversions',
    },
    {
      title: '点击率',
      dataIndex: 'ctr',
      key: 'ctr',
      render: (val) => <Tag color="blue">{val}</Tag>,
    },
    {
      title: '转化率',
      dataIndex: 'cvr',
      key: 'cvr',
      render: (val) => <Tag color="purple">{val}</Tag>,
    },
    {
      title: '总消耗',
      dataIndex: 'cost',
      key: 'cost',
      render: (val) => `¥${val}`,
    },
    {
      title: '退款金额',
      dataIndex: 'refund',
      key: 'refund',
      render: (val) => <Tag color="green">¥{val}</Tag>,
    },
    {
      title: '净消耗',
      dataIndex: 'netCost',
      key: 'netCost',
      render: (val) => <span style={{ fontWeight: 'bold' }}>¥{val}</span>,
    },
  ];

  const advertiserBalanceColumns = [
    {
      title: '广告主',
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
  ];

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      await reportApi.generateDailyReport(null, null, selectedDate.format('YYYY-MM-DD'));
      message.success('报表生成成功');
      loadData();
    } catch (error) {
      message.error('生成报表失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert
        message="报表和对账说明"
        description={
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>每日报表：包含曝光、点击、转化、CTR、CVR、消耗等数据</li>
            <li>余额对账：展示广告主余额、预算、消耗情况</li>
            <li>作弊退款：作弊点击会自动识别并退款</li>
            <li>延迟转化：支持转化数据延迟上报，自动回写历史报表</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />

      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>选择日期：</span>
          <DatePicker
            value={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            style={{ width: 200 }}
          />
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            刷新
          </Button>
          <Button onClick={handleGenerateReport} loading={loading}>
            生成报表
          </Button>
        </div>
      </div>

      {dailySummary && (
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="曝光量"
                value={dailySummary.totalImpressions || 0}
                prefix={<EyeOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="有效点击"
                value={dailySummary.validClicks || 0}
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: '8px' }}>
                点击率: <Tag color="blue">{dailySummary.ctr}</Tag>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="转化量"
                value={dailySummary.totalConversions || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div style={{ marginTop: '8px' }}>
                转化率: <Tag color="purple">{dailySummary.cvr}</Tag>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="净消耗"
                value={dailySummary.netCost || 0}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#fa8c16' }}
              />
              <div style={{ marginTop: '8px' }}>
                总消耗: ¥{dailySummary.totalCost} | 退款: ¥{dailySummary.refundAmount}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      <Card title="当日作弊检测情况" style={{ marginBottom: '16px' }}>
        {dailySummary && (
          <Descriptions bordered column={4}>
            <Descriptions.Item label="总点击量">{dailySummary.totalClicks}</Descriptions.Item>
            <Descriptions.Item label="有效点击">
              <Tag color="green">{dailySummary.validClicks}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="作弊点击">
              <Tag color="red">{dailySummary.fraudClicks}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="退款金额">
              <Tag color="green">¥{dailySummary.refundAmount}</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title="广告主余额对账" extra={<FileTextOutlined style={{ color: '#1890ff' }} />}>
        <Table
          dataSource={balanceSummary?.advertisers || []}
          columns={advertiserBalanceColumns}
          rowKey="advertiserId"
          loading={loading}
          pagination={false}
          footer={() => (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px' }}>
              <span>平台总余额: <span style={{ color: '#3f8600', fontWeight: 'bold' }}>¥{balanceSummary?.totalPlatformBalance || 0}</span></span>
              <span>平台总消耗: <span style={{ color: '#cf1322', fontWeight: 'bold' }}>¥{balanceSummary?.totalPlatformSpent || 0}</span></span>
            </div>
          )}
        />
      </Card>
    </div>
  );
};

export default ReportPage;
