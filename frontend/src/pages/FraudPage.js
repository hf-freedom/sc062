import React, { useState, useEffect } from 'react';
import { Card, Table, Button, message, Tag, Alert, Descriptions, Row, Col, Statistic } from 'antd';
import { ReloadOutlined, WarningOutlined, CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { fraudApi } from '../api';

const FraudPage = () => {
  const [loading, setLoading] = useState(false);
  const [fraudClicks, setFraudClicks] = useState([]);

  useEffect(() => {
    loadFraudClicks();
  }, []);

  const loadFraudClicks = async () => {
    try {
      setLoading(true);
      const response = await fraudApi.getFraudClicks();
      setFraudClicks(response.data);
    } catch (error) {
      message.error('加载作弊点击列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRunDetection = async () => {
    try {
      setLoading(true);
      const response = await fraudApi.runDetection();
      const data = response.data;
      message.success(`作弊检测完成，发现 ${data.fraudClickCount} 个作弊点击`);
      loadFraudClicks();
    } catch (error) {
      message.error('执行作弊检测失败');
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
      title: '点击ID',
      dataIndex: 'clickId',
      key: 'clickId',
    },
    {
      title: '计划ID',
      dataIndex: 'planId',
      key: 'planId',
    },
    {
      title: '曝光ID',
      dataIndex: 'impressionId',
      key: 'impressionId',
    },
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      render: (ip) => <Tag color="orange">{ip}</Tag>,
    },
    {
      title: '设备ID',
      dataIndex: 'deviceId',
      key: 'deviceId',
      render: (deviceId) => deviceId ? <Tag color="blue">{deviceId}</Tag> : '-',
    },
    {
      title: '点击时间',
      dataIndex: 'clickTime',
      key: 'clickTime',
    },
    {
      title: '检测时间',
      dataIndex: 'fraudDetectedTime',
      key: 'fraudDetectedTime',
    },
    {
      title: '作弊原因',
      dataIndex: 'fraudReason',
      key: 'fraudReason',
      render: (reason) => <Tag color="red">{reason}</Tag>,
    },
  ];

  return (
    <div>
      <Alert
        message="作弊检测说明"
        description={
          <div>
            <p style={{ margin: 0 }}>系统自动检测以下作弊行为，并自动退款：</p>
            <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
              <li>同一IP点击次数异常（超过10次/分钟）</li>
              <li>同一设备点击次数异常（超过10次/分钟）</li>
              <li>点击频率异常（间隔小于1秒）</li>
              <li>点击对应的曝光记录不存在</li>
            </ul>
            <p style={{ margin: '8px 0 0 0' }}>
              <Tag color="green">检测到作弊后自动退款</Tag>
              <Tag color="orange">系统每30秒自动执行一次检测</Tag>
            </p>
          </div>
        }
        type="warning"
        showIcon
        style={{ marginBottom: '16px' }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="作弊点击总数"
              value={fraudClicks.length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="作弊类型"
              value={new Set(fraudClicks.map(c => c.fraudReason)).size}
              prefix={<SearchOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="自动检测"
              value="30秒/次"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="作弊点击列表">
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <Tag color="orange">检测规则：</Tag>
            <Tag>同一IP超过10次/分钟</Tag>
            <Tag>同一设备超过10次/分钟</Tag>
            <Tag>点击间隔小于1秒</Tag>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              type="primary"
              danger
              icon={<SearchOutlined />}
              onClick={handleRunDetection}
              loading={loading}
            >
              执行作弊检测
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadFraudClicks}
              loading={loading}
            >
              刷新
            </Button>
          </div>
        </div>

        <Table
          dataSource={fraudClicks}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: '暂无作弊点击记录，系统每30秒自动检测一次',
          }}
        />
      </Card>

      <Card title="检测规则详情" style={{ marginTop: '16px' }}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="规则1：同一IP点击异常">
            同一IP地址在1分钟内点击次数超过10次，判定为作弊点击
          </Descriptions.Item>
          <Descriptions.Item label="规则2：同一设备点击异常">
            同一设备ID在1分钟内点击次数超过10次，判定为作弊点击
          </Descriptions.Item>
          <Descriptions.Item label="规则3：点击频率异常">
            同一用户两次点击间隔小于1秒，判定为作弊点击
          </Descriptions.Item>
          <Descriptions.Item label="规则4：曝光记录不存在">
            点击对应的曝光记录不存在，判定为作弊点击
          </Descriptions.Item>
          <Descriptions.Item label="作弊处理">
            <Tag color="green">自动退款</Tag> - 检测到作弊后，自动将扣费金额退还到广告主账户
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default FraudPage;
