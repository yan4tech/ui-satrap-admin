import React from 'react';
import { Breadcrumb, Card } from 'antd';
import { Link } from 'react-router-dom';
import { HomeOutlined, UserOutlined } from '@ant-design/icons';

const DriverBread = () => {
  return (
    <Card className="gx-card">
      <Breadcrumb>
        <Breadcrumb.Item>
          <Link to={'/main/dashboard/crm'}>
            <span className="gx-link">
              <HomeOutlined />
            </span>
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          {/* <span className='gx-ml-2'></span> */}
          <Link to={'/main/branch/search'}>
            <span className="gx-link">
              <UserOutlined />
              لیست شعبات
            </span>
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>شعبه جدید</Breadcrumb.Item>
      </Breadcrumb>
    </Card>
  );
};

export default DriverBread;
