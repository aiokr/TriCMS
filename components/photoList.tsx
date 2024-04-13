"use client"
import React, { useState, useEffect } from 'react';
import { Table, Input, Toast, Select, Modal, Button, Card } from '@douyinfe/semi-ui';
import Image from 'next/image'
import { auth } from '@/auth';
import Link from 'next/link';

interface PhotoListProps {
  photosData: any; // 这里应该用更具体的类型替代 any，以匹配 photosData 的结构
  assertsData: any; // 这里应该用更具体的类型替代 any，以匹配 assertsData 的结构
}

interface SelectedPhoto {
  assetId: string | null;
  id: string | null;
  title: string | null;
  url: string | null;
  width: number | null;
  height: number | null;
  DateTimeOriginal: Date | null;
  Make: string | null;
  Model: string | null;
  LensMake: string | null;
  LensModel: string | null;
}


const PhotoListComponent: React.FC<PhotoListProps> = ({ photosData, assertsData }) => {

  const [data, setData] = useState(photosData);  // Photos 列表的数据
  useEffect(() => { setData(photosData); }, [photosData]);
  const [assertData, setAssertData] = useState(assertsData);  // Assets 列表的数据
  useEffect(() => { setAssertData(assertsData); }, [assertsData]);
  const [selected, setSelected] = useState<SelectedPhoto>({ // 选中照片的数据
    assetId: null,
    id: null,
    title: null,
    url: null,
    width: null,
    height: null,
    DateTimeOriginal: null,
    Make: null,
    Model: null,
    LensMake: null,
    LensModel: null
  });
  useEffect(() => { setSelected(selected); }, [selected]);
  const [visible, setVisible] = useState(false);  // 新建 Photo 的弹窗

  const showDialog = () => {
    setVisible(true);
  };

  // 点击弹窗的确定，清理数据，然后进行上传操作
  const handleOk = () => {
    // 根据选中的 id 查找原始资产
    const originalAsset = assertsData.find((item: any) => item.assetId === selected.assetId);

    // 创建一个新对象，如果值未更改，则设置为 null
    const cleanedSelected = Object.keys(selected).reduce((acc: any, key) => {
      console.log(selected.assetId)
      // 断言 key 为 SelectedPhoto 的键
      const selectedKey = key as keyof SelectedPhoto;
      // 检查原始资产是否存在，以及 selected[key] 是否与之不同
      const hasChanged = originalAsset && (selected[selectedKey] !== originalAsset[selectedKey]);
      // 如果值未更改，则设置为 null，否则保留当前值
      acc[selectedKey] = hasChanged ? selected[selectedKey] : null;
      acc.assetId = selected.assetId
      acc.id = selected.id
      console.log(acc);
      return acc;
    }, {} as SelectedPhoto);

    const json = JSON.stringify(cleanedSelected); // 清理后的 SelectedPhoto 对象
    newFlowItem(json);  // 调用新建操作
    setVisible(false);
  };
  const handleCancel = () => {
    setVisible(false);
    console.log('Cancel button clicked');
  };
  const handleAfterClose = () => {
    console.log('After Close callback executed');
  };

  const { Meta } = Card

  const outSlotNode = <Link href={'/dashboard/assets'} className='block w-full text-indigo-500 my-2 text-center font-bold'>上传新文件</Link>

  const renderSelectedItem = (optionNode: any) => (
    <>{optionNode.label}</>
  )

  // 选中项改变
  const selectOnChange = (value: any) => {
    const selectedAsset = assertData.find((item: any) => item.assetId === value);
    if (selectedAsset) {
      setSelected(prevSelected => ({
        ...prevSelected,
        assetId: selectedAsset.assetId,
        url: selectedAsset.url,
        width: selectedAsset.width,
        height: selectedAsset.height,
        DateTimeOriginal: selectedAsset.DateTimeOriginal,
        Make: selectedAsset.Make,
        Model: selectedAsset.Model,
        LensMake: selectedAsset.LensMake,
        LensModel: selectedAsset.LensModel
        // 注意：这里没有更新 title 字段
      }));
    }
  };

  // 写入选中照片
  const setPhoto = (event: React.ChangeEvent<HTMLInputElement>, field: keyof SelectedPhoto) => {
    setSelected(prevSelected => ({
      ...prevSelected,
      [field]: event
    }));
  };

  // 处理新建照片流项目的逻辑
  const newFlowItem = async (json: string) => {
    try {
      const response = await fetch('/api/newphoto', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: json
      })
      if (response.ok) {
        Toast.success('New flow item created successfully.' + json)
      } else {
        Toast.error('Error creating new flow item.')
      }
    } catch (error) {
      console.error(error)
    }
  }

  // 处理删除照片的逻辑
  const deleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/delete/photo/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        Toast.success(`File ID ${id} deleted successfully.`)
        setVisible(false);
      } else {
        Toast.error('Error deleting file.')
        setVisible(false);
      }
    } catch (error) {
      console.error(error)
      setVisible(false);
    }
  }

  // Open PhotoFlow Item Editor
  const openPhotoEditor = (data: any) => {
    // 如果 data 为 null，说明是创建新照片，否则是编辑现有照片
    const newData = data || {
      id: null,
      assetId: null,
      title: null,
      url: null,
      width: null,
      height: null,
      DateTimeOriginal: null,
      Make: null,
      Model: null,
      LensMake: null,
      LensModel: null
    };
    setSelected(newData);
    setVisible(true);
  }

  const itemDescription = (item: any) => {
    return (
      <div className='text-xs flex gap-1 pt-1'>
        <p>{item.Make}</p>
        <p>{item.Model}</p>
        <p>{item.LensMake}</p>
        <p>{item.LensModel}</p>
      </div>
    )
  }

  return (
    <>
      <div className='grid grid-cols-2 lg:grid-cols-3 gap-2'>
        <button className='border rounded-[6px] w-full h-full' onClick={() => openPhotoEditor(null)}>新建项目
        </button>
        {data.map((item: any) => (
          <button key={item.id} onClick={() => openPhotoEditor(item)}>
            <Card cover={<Image src={item.url} alt={item.title} height={item.height} width={item.width} className='aspect-[4/3] object-cover' unoptimized />}>
              <Meta title={item.title || 'No Title'} />
              <Meta description={itemDescription(item)} />
            </Card>
          </button>
        ))}
        <Modal title="新建图片" visible={visible} fullScreen
          onOk={handleOk} onCancel={handleCancel} closeOnEsc={true} closable={false} afterClose={handleAfterClose}>
          <div className='container mx-auto max-w-[800px]'>
            <div>
              <Select
                onChange={selectOnChange}
                style={{ width: '100%', height: '140px' }}
                dropdownStyle={{ width: '100%' }}
                outerBottomSlot={outSlotNode}
                renderSelectedItem={renderSelectedItem}
                value={selected.assetId || undefined}
              >
                {assertData.map((item: any) => (
                  <Select.Option key={item.assetId} value={item.assetId} className='flex gap-2'>
                    <div className='flex gap-2'>
                      <Image className='max-h-[120px] max-w-[160px] object-cover ' src={item.url} alt={item.title} width={item.width} height={160} unoptimized />
                      <div>
                        <div className='font-bold'>{item.assetId + ' - ' + item.title}</div>
                        <div>{item.DateTimeOriginal.toUTCString()}</div>
                        <div>{item.Make + ' - ' + item.Model}</div>
                        <div>{item.LensModel}</div>
                      </div>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mt-8'>
              <Input size='large' prefix="PhotoFlowID*" className='col-span-2' value={selected.id || ''} disabled></Input>
              <Input size='large' prefix="AssertsID*" className='col-span-2' value={selected.assetId || ''} onChange={(event: any) => setPhoto(event, 'assetId')} ></Input>
              <Input size='large' prefix="Title*" className='col-span-4' value={selected.title || ''} onChange={(event: any) => setPhoto(event, 'title')} ></Input>
              <Input size='large' placeholder={selected.Make} className='col-span-1' prefix="Make*" onChange={(event: any) => setPhoto(event, 'Make')}  ></Input>
              <Input size='large' placeholder={selected.Model} className='col-span-3' prefix="Model*" onChange={(event: any) => setPhoto(event, 'Model')} ></Input>
              <Input size='large' placeholder={selected.LensMake || ''} className='col-span-3' prefix="LensMake*" onChange={(event: any) => setPhoto(event, 'LensMake')}></Input>
              <Input size='large' placeholder={selected.LensModel} className='col-span-3' prefix="LensModel*" onChange={(event: any) => setPhoto(event, 'LensModel')}></Input>
            </div>
            <button className='bg-red-500 text-white py-2 px-4 my-6 rounded' onClick={() => deleteItem(selected.id)}>删除</button>
          </div>
        </Modal>
      </div>
    </>
  )

}

export default PhotoListComponent;