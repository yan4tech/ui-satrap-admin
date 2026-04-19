import React, { useState, useEffect } from "react";
import IntlMessages from "util/IntlMessages";
import {
  onGetDrivers,
  onDeleteDriver,
  setToDefault,
  hideMessage,
} from "appRedux/actions/Driver";
import { useHistory } from "react-router-dom";

import { useSelector, useDispatch } from "react-redux";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import PersianInput from "../../antd/persianInput";

import {
  Button,
  Card,
  Table,
  Modal,
  Col,
  Form,
  message,
  Tooltip,
  notification,
  Select,
  Pagination,
  Input,
  Row,
  Radio,
  Popconfirm,
  Tag,
} from "antd";

const scroll = { y: 400 };
const { Option } = Select;

const PersonalDrivers = (props) => {
  const history = useHistory();
  const dispatch = useDispatch();
  const [selectedPage, setSelectedPage] = useState(1)

  const drivers = useSelector((state) => {
    return state.driver.drivers;
  });
  const alertMessage = useSelector((state) => {
    return state.driver.alertMessage;
  });
  const showMessage = useSelector((state) => {
    return state.driver.showMessage;
  });

  const notify = useSelector((state) => {
    return state.driver.notify;
  });

  useEffect(() => {
    let limit = 10;
    let offset = 0;
    dispatch(onGetDrivers(null, { limit, offset }));
    if (showMessage) {
      dispatch(hideMessage());
    }
  }, [message]);

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [loading, setLoading] = useState(false);

  const deleteAction = (record) => {
    console.log("deleteAction : ", record);
    dispatch(onDeleteDriver(record));
  };

  const editAction = (record) => {
    console.log(record);
    history.push(`edit/${record.id}`);
  };

  const onSelectChange = (selectedRowKeys) => {
    setSelectedRowKeys(selectedRowKeys);
  };

  const { onFindDriverClose, open } = props;
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const [expand, setExpand] = useState(false);
  const [form] = Form.useForm();

  const RadioButton = Radio.Button;
  const RadioGroup = Radio.Group;

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 5 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 18 },
      md: { span: 16 },
      lg: { span: 12 },
    },
  };

  const onChange = (e) => {};
  const onSearch = (e) => {
    console.log("search :", e);
    let limit = 10;
    let offset = 0;
    dispatch(onGetDrivers(e, { limit, offset }));
  };

  const onChangePagination = (page, pagesize) => {
    setSelectedPage(page)
    console.log("onChangePagination :", page, pagesize, form.getFieldsValue());
    let limit = pagesize;
    let offset = (page-1)*pagesize;
    dispatch(onGetDrivers(form.getFieldsValue(), { limit, offset }));
  };

  const getFields = () => {
    return (
      <>
        <Col lg={8} md={8} sm={12} xs={24}>
          <Form.Item
            label="شناسه کاربری :"
            name="id"
            hasFeedback
            // validateStatus="success"
            //   {...formItemLayout}
          >
            <PersianInput component={Input} />
            {/* <Input allowClear placeholder="نام " >{driver.firstName}</Input> */}
          </Form.Item>
        </Col>
        <Col lg={8} md={8} sm={12} xs={24}>
          <div className="gx-form-row0">
            <Form.Item
              name={"name"}
              label={`نام`}
              // rules={[
              //   {
              //     required: true,
              //     message: "Input something!",
              //   },
              // ]}
            >
              <Input placeholder="نام" />
            </Form.Item>
          </div>
        </Col>

        <Col lg={8} md={8} sm={12} xs={24}>
          <div className="gx-form-row0">
            <Form.Item
              name={"family"}
              label={`نام خانوادگی`}
              // rules={[
              //   {
              //     required: true,
              //     message: "Input something!",
              //   },
              // ]}
            >
              <Input placeholder="نام خانوادگی" />
            </Form.Item>
          </div>
        </Col>
        <Col lg={8} md={8} sm={12} xs={24}>
          <div className="gx-form-row0">
            <Form.Item
              name={"mobile"}
              label={`موبایل`}
              // rules={[
              //   {
              //     required: true,
              //     message: "Input something!",
              //   },
              // ]}
            >
              <Input placeholder="موبایل" />
            </Form.Item>
          </div>
        </Col>

        <Col lg={8} md={8} sm={12} xs={24}>
          <Form.Item
            name="active"
            label="وضعیت فعال"
            // hasFeedback
            //   {...formItemLayout}
            style={{ width: "95%" }}
          >
            <Select>
              <Option value="true">فعال</Option>
              <Option value="false">غیرفعال</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col lg={8} md={8} sm={12} xs={24}>
          <Form.Item
            name="verified"
            label="وضعیت تایید"
            // hasFeedback
            //   {...formItemLayout}
            style={{ width: "95%" }}
          >
            <Select>
              <Option value="true">تایید شده</Option>
              <Option value="false">منتظر تایید</Option>
            </Select>
          </Form.Item>
        </Col>
      </>
    );
  };

  {
    notify &&
      notify.action == true &&
      notification.success({
        message: notify.message,
      });
    dispatch(setToDefault());
  }

  {
    notify &&
      notify.action == false &&
      notification.error({
        message: notify.message,
      });
    dispatch(setToDefault());
  }

  console.log("drivers : ", drivers);
  console.log("page : ", selectedPage);
  return (
    <>
      {notify && notify.action == false}
      <Row justify="end" align="middle">
        <Button
          onClick={() => {
            history.push("create");
          }}
        >
          راننده جدید
        </Button>
      </Row>
      <Card>
        <Row>
          <Form
            form={form}
            name="مشخصات راننده"
            className="ant-advanced-search-form"
            onFinish={onSearch}
          >
            <Row gutter={24}>{getFields()}</Row>

            <Row>
              <Col span={24} style={{ textAlign: "right" }}>
                <Button type="primary" htmlType="submit">
                  جستجو
                </Button>
                <Button
                  onClick={() => {
                    form.resetFields();
                  }}
                >
                  پاک کردن
                </Button>
              </Col>
            </Row>
          </Form>
        </Row>
      </Card>
      {drivers && <Table
        className="gx-table-responsive"
        rowSelection={rowSelection}
        columns={[
          {
            title: "کد راننده",
            dataIndex: "id",
          },
          {
            title: "نام",
            dataIndex: "name",
          },
          {
            title: "نام خانوادگی",
            dataIndex: "family",
          },
          {
            title: "موبایل",
            dataIndex: "mobile",
          },
          {
            title: "وضعیت",
            dataIndex: "active",
            render: (active) => {
              if (active) {
                return <Tag color="green">فعال</Tag>;
              }
              return <Tag color="red">غیرفعال</Tag>;
            },
          },
          {
            title: "وضعیت تایید",
            dataIndex: "verified",
            render: (active) => {
              if (active) {
                return <Tag color="green">تایید شده</Tag>;
              }
              return <Tag color="red">در انتظار تایید</Tag>;
            },
          },
          {
            title: "تاریخ ثبت نام",
            dataIndex: "created_at",
          },

          {
            title: "عملیات",
            key: "action",
            width: 100,
            render: (text, record) => {
              return (
                <Row justify="end" align="middle">
                  <Button
                    type="text"
                    icon={
                      <EditOutlined
                        style={{
                          color: "#153E6D",
                        }}
                      />
                    }
                    onClick={() => {
                      editAction(record);
                    }}
                  />

                  <Popconfirm
                    title="راننده حذف شود؟"
                    okType="danger"
                    onConfirm={() => {
                      deleteAction(record);
                    }}
                  >
                    <Tooltip title="حذف" placement="bottom">
                      <Button
                        type="text"
                        icon={
                          <DeleteOutlined
                            style={{
                              color: "red",
                            }}
                          />
                        }
                        // onClick={handleAction}
                      />
                    </Tooltip>
                  </Popconfirm>

                  {/* <Button
                    type="text"
                    icon={
                      <DeleteOutlined
                        style={{
                          color: "red",
                        }}
                      />
                    }
                    onClick={handleAction}
                  /> */}
                </Row>
              );
            },
          },
        ]}
        dataSource={drivers.data}
        // bordered
        pagination={{ defaultPageSize: 10, current:selectedPage ,  pageSizeOptions: ['10', '20', '30'], total:drivers.total,  onChange: onChangePagination}}

        scroll={scroll}
      />
}
      {showMessage
        ? (alertMessage.type == "error" &&
            message.error(alertMessage.message.toString()),
          alertMessage.type == "success" &&
            message.success(alertMessage.message.toString()),
          alertMessage.type == "warn" &&
            message.warn(alertMessage.message.toString()))
        : null}
    </>
  );
};

export default PersonalDrivers;
