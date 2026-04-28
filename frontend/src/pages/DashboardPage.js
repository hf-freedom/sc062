import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, message } from 'antd';
import {
  DollarOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  ArrowUpOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { reportApi } from '../api';

const DashboardPage = ({ advertisers, refresh }) => {
  const [summary, setSummary] = useState(null);
  const [balanceSummary, setBalanceSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryRes, balanceRes] = await Promise.all([
        reportApi.getDailySummary(),
        reportApi.getBalanceSummary(),
      ]);
      setSummary(summaryRes.data);
      setBalanceSummary(balanceRes.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const advertiserColumns = [
    {
      title: '广告主ID',
      dataIndex: 'advertiserId',
      key: 'advertiserId',
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
      render: (val) => <span style={{ color: '#3f8600' }}>¥{val}</span>,
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
      title: '今日消耗',
      dataIndex: 'dailySpent',
      key: 'dailySpent',
      render: (val) => <span style={{ color: '#cf1322' }}>¥{val}</span>,
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

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => { loadData(); refresh(); }}
          loading={loading}
        >
          刷新数据
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日曝光量"
              value={summary?.totalImpressions || 0}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日点击量"
              value={summary?.validClicks || 0}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={<Tag color="green">{summary?.ctr || '0%'}</Tag>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日转化量"
              value={summary?.totalConversions || 0}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#722ed1' }}
              suffix={<Tag color="purple">{summary?.cvr || '0%'}</Tag>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日消耗"
              value={summary?.netCost || 0}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#fa8c16' }}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      {summary && (
        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col span={8}>
            <Card title="作弊检测">
              <p>作弊点击次数: <Tag color="red">{summary.fraudClicks}</Tag></p>
              <p>退款金额: <Tag color="green">¥{summary.refundAmount}</Tag></p>
              <p>总消耗: ¥{summary.totalCost}</p>
              <p>净消耗: ¥{summary.netCost}</p>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="平台汇总">
              <p>广告主数量: {balanceSummary?.advertisers?.length || 0}</p>
              <p>平台总余额: <Tag color="green">¥{balanceSummary?.totalPlatformBalance || 0}</Tag></p>
              <p>平台总消耗: <Tag color="orange">¥{balanceSummary?.totalPlatformSpent || 0}</Tag></p>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="系统功能说明">
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                <li>预算校验：曝光前校验余额和预算</li>
                <li>素材审核：需审核通过才能投放</li>
                <li>日预算耗尽：自动暂停计划</li>
                <li>余额不足：所有计划欠费暂停</li>
                <li>延迟转化：支持回写历史报表</li>
                <li>作弊检测：自动识别并退款</li>
                <li>已结算报表：只能生成调整单</li>
              </ul>
            </Card>
          </Col>
        </Row>
      )}

      <Card title="广告主列表" style={{ marginTop: '16px' }}>
        <Table
          dataSource={balanceSummary?.advertisers || advertisers}
          columns={advertiserColumns}
          rowKey="advertiserId"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default DashboardPage;
