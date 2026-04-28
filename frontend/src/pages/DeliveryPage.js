import React, { useState } from 'react';
import { Card, Form, Input, Select, InputNumber, Button, message, Descriptions, Tag, Divider, Alert, Row, Col, DatePicker } from 'antd';
import { RocketOutlined, ThunderboltOutlined, CheckCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { deliveryApi } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;

const DeliveryPage = ({ advertisers }) => {
  const [form] = Form.useForm();
  const [clickForm] = Form.useForm();
  const [conversionForm] = Form.useForm();
  const [backfillForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState(null);

  const handleRequestAd = async (values) => {
    try {
      setLoading(true);
      const requestData = {
        gender: values.gender,
        age: values.age,
        region: values.region,
        interests: values.interests?.split(',').map(i => i.trim()).filter(i => i),
        userId: values.userId,
        deviceId: values.deviceId,
        ip: values.ip,
        userAgent: values.userAgent,
      };

      const response = await deliveryApi.requestAd(requestData);
      const data = response.data;

      if (data.success) {
        setDeliveryResult(data);
        clickForm.setFieldsValue({ requestId: data.requestId });
        message.success('广告投放成功！');
      } else {
        message.error('投放失败: ' + data.message);
        setDeliveryResult(data);
      }
    } catch (error) {
      message.error('投放请求失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleRecordClick = async (values) => {
    try {
      setLoading(true);
      const response = await deliveryApi.recordClick(values);
      const data = response.data;

      if (data.success) {
        conversionForm.setFieldsValue({ clickId: data.clickId });
        backfillForm.setFieldsValue({ clickId: data.clickId });
        message.success('点击记录成功！');
      } else {
        message.error('记录失败: ' + data.message);
      }
    } catch (error) {
      message.error('请求失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleRecordConversion = async (values) => {
    try {
      setLoading(true);
      const response = await deliveryApi.recordConversion(values);
      const data = response.data;

      if (data.success) {
        message.success('转化记录成功！');
      } else {
        message.error('记录失败: ' + data.message);
      }
    } catch (error) {
      message.error('请求失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleBackfillConversion = async (values) => {
    try {
      setLoading(true);
      const requestData = {
        clickId: values.clickId,
        conversionType: values.conversionType,
        conversionValue: values.conversionValue,
        conversionTime: values.conversionTime?.toISOString(),
      };

      const response = await deliveryApi.recordBackfillConversion(requestData);
      const data = response.data;

      if (data.success) {
        message.success('延迟转化回写成功！已更新历史报表');
      } else {
        message.error('回写失败: ' + data.message);
      }
    } catch (error) {
      message.error('请求失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert
        message="投放流程说明"
        description={
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            <li>请求广告：系统根据人群定向选择合适的广告计划，记录曝光并扣减预算</li>
            <li>记录点击：记录用户点击行为，归因到广告计划</li>
            <li>记录转化：记录转化行为（下单、注册等）</li>
            <li>延迟转化回写：支持转化数据延迟上报，自动回写历史报表</li>
          </ol>
        }
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="1. 请求广告（曝光）" extra={<RocketOutlined style={{ color: '#1890ff' }} />}>
            <Form form={form} layout="vertical" onFinish={handleRequestAd}>
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name="gender" label="性别">
                    <Select placeholder="请选择性别" allowClear>
                      <Option value="MALE">男性</Option>
                      <Option value="FEMALE">女性</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="age" label="年龄">
                    <InputNumber style={{ width: '100%' }} placeholder="请输入年龄" min={0} max={100} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name="region" label="地区">
                    <Input placeholder="请输入地区，如：北京" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="interests" label="兴趣（逗号分隔）">
                    <Input placeholder="如：科技,数码,游戏" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name="userId" label="用户ID">
                    <Input placeholder="请输入用户ID" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="deviceId" label="设备ID">
                    <Input placeholder="请输入设备ID" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name="ip" label="IP地址">
                    <Input placeholder="请输入IP地址" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="userAgent" label="User-Agent">
                    <Input placeholder="请输入User-Agent" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  请求广告
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="投放结果">
            {deliveryResult ? (
              <div>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="投放状态">
                    {deliveryResult.success ? (
                      <Tag color="green" icon={<CheckCircleOutlined />}>成功</Tag>
                    ) : (
                      <Tag color="red">失败</Tag>
                    )}
                  </Descriptions.Item>
                  {deliveryResult.success && (
                    <>
                      <Descriptions.Item label="请求ID">{deliveryResult.requestId}</Descriptions.Item>
                      <Descriptions.Item label="计划ID">{deliveryResult.planId}</Descriptions.Item>
                      <Descriptions.Item label="计划名称">{deliveryResult.planName}</Descriptions.Item>
                      <Descriptions.Item label="素材ID">{deliveryResult.materialId}</Descriptions.Item>
                      <Descriptions.Item label="出价">¥{deliveryResult.bidPrice}/次</Descriptions.Item>
                    </>
                  )}
                  <Descriptions.Item label="消息">{deliveryResult.message}</Descriptions.Item>
                </Descriptions>
                {!deliveryResult.success && (
                  <Alert
                    message="投放失败可能原因"
                    description="广告主余额不足、日预算耗尽、总预算耗尽、没有匹配的人群定向、素材未审核通过"
                    type="warning"
                    showIcon
                    style={{ marginTop: '16px' }}
                  />
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                请先执行广告请求
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card title="2. 记录点击" extra={<ThunderboltOutlined style={{ color: '#52c41a' }} />}>
            <Form form={clickForm} layout="vertical" onFinish={handleRecordClick}>
              <Form.Item
                name="requestId"
                label="曝光请求ID"
                rules={[{ required: true, message: '请输入请求ID' }]}
              >
                <Input placeholder="请输入请求ID" />
              </Form.Item>
              <Form.Item name="userId" label="用户ID">
                <Input placeholder="请输入用户ID" />
              </Form.Item>
              <Form.Item name="deviceId" label="设备ID">
                <Input placeholder="请输入设备ID" />
              </Form.Item>
              <Form.Item name="ip" label="IP地址">
                <Input placeholder="请输入IP地址" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  记录点击
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="3. 记录转化" extra={<CheckCircleOutlined style={{ color: '#722ed1' }} />}>
            <Form form={conversionForm} layout="vertical" onFinish={handleRecordConversion}>
              <Form.Item
                name="clickId"
                label="点击ID"
                rules={[{ required: true, message: '请输入点击ID' }]}
              >
                <Input placeholder="请输入点击ID" />
              </Form.Item>
              <Form.Item name="conversionType" label="转化类型" initialValue="PURCHASE">
                <Select>
                  <Option value="PURCHASE">下单购买</Option>
                  <Option value="REGISTER">注册</Option>
                  <Option value="DOWNLOAD">下载</Option>
                  <Option value="ADD_CART">加入购物车</Option>
                </Select>
              </Form.Item>
              <Form.Item name="conversionValue" label="转化价值（元）" initialValue={0}>
                <InputNumber style={{ width: '100%' }} placeholder="请输入转化价值" min={0} precision={2} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  记录转化
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="4. 延迟转化回写" extra={<HistoryOutlined style={{ color: '#fa8c16' }} />}>
            <Alert
              message="支持转化数据延迟上报，自动回写历史报表"
              type="info"
              showIcon
              style={{ marginBottom: '16px', fontSize: '12px' }}
            />
            <Form form={backfillForm} layout="vertical" onFinish={handleBackfillConversion}>
              <Form.Item
                name="clickId"
                label="点击ID"
                rules={[{ required: true, message: '请输入点击ID' }]}
              >
                <Input placeholder="请输入历史点击ID" />
              </Form.Item>
              <Form.Item name="conversionType" label="转化类型" initialValue="PURCHASE">
                <Select>
                  <Option value="PURCHASE">下单购买</Option>
                  <Option value="REGISTER">注册</Option>
                  <Option value="DOWNLOAD">下载</Option>
                </Select>
              </Form.Item>
              <Form.Item name="conversionValue" label="转化价值（元）" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
              <Form.Item name="conversionTime" label="转化发生时间" initialValue={dayjs().subtract(1, 'day')}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block danger>
                  回写历史报表
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DeliveryPage;
