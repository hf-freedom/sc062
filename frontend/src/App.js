import React, { useState, useEffect } from 'react';
import { Layout, Menu, message, Spin } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  PictureOutlined,
  RocketOutlined,
  BarChartOutlined,
  CalculatorOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import DashboardPage from './pages/DashboardPage';
import AdvertiserPage from './pages/AdvertiserPage';
import PlanPage from './pages/PlanPage';
import MaterialPage from './pages/MaterialPage';
import DeliveryPage from './pages/DeliveryPage';
import ReportPage from './pages/ReportPage';
import SettlementPage from './pages/SettlementPage';
import FraudPage from './pages/FraudPage';
import { advertiserApi } from './api';

const { Header, Sider, Content } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [advertisers, setAdvertisers] = useState([]);

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

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '系统概览',
    },
    {
      key: 'advertiser',
      icon: <UserOutlined />,
      label: '广告主管理',
    },
    {
      key: 'plan',
      icon: <FileTextOutlined />,
      label: '广告计划',
    },
    {
      key: 'material',
      icon: <PictureOutlined />,
      label: '广告素材',
    },
    {
      key: 'delivery',
      icon: <RocketOutlined />,
      label: '投放测试',
    },
    {
      key: 'report',
      icon: <BarChartOutlined />,
      label: '数据报表',
    },
    {
      key: 'settlement',
      icon: <CalculatorOutlined />,
      label: '结算管理',
    },
    {
      key: 'fraud',
      icon: <WarningOutlined />,
      label: '作弊检测',
    },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage advertisers={advertisers} refresh={loadAdvertisers} />;
      case 'advertiser':
        return <AdvertiserPage />;
      case 'plan':
        return <PlanPage />;
      case 'material':
        return <MaterialPage />;
      case 'delivery':
        return <DeliveryPage advertisers={advertisers} />;
      case 'report':
        return <ReportPage advertisers={advertisers} />;
      case 'settlement':
        return <SettlementPage advertisers={advertisers} />;
      case 'fraud':
        return <FraudPage />;
      default:
        return <DashboardPage advertisers={advertisers} refresh={loadAdvertisers} />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="dark"
      >
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? '14px' : '18px',
          fontWeight: 'bold',
          background: 'rgba(255, 255, 255, 0.1)',
          margin: '16px',
          borderRadius: '4px',
        }}>
          {collapsed ? 'AD' : '广告投放系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentPage]}
          items={menuItems}
          onClick={({ key }) => setCurrentPage(key)}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>
            {menuItems.find(item => item.key === currentPage)?.label || '系统概览'}
          </h2>
        </Header>
        <Content style={{
          margin: '24px',
          padding: '24px',
          background: '#fff',
          minHeight: 280,
          borderRadius: '8px',
        }}>
          <Spin spinning={loading}>
            {renderPage()}
          </Spin>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
