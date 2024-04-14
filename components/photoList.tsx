"use client"
import React, { useState, useEffect } from 'react';
import { Table, Input, Toast, Select, Modal, Button, Card } from '@douyinfe/semi-ui';
import Image from 'next/image'
import { auth } from '@/auth';
import Link from 'next/link';

const { Meta } = Card

interface PhotoListProps {
  photosData: any;
  assertsData: any;
  combinedData: any;
}

interface ExifData {
  Make?: string;
  Model?: string;
  LensMake?: string;
  LensModel?: string;
  width?: number;
  height?: number;
  DateTimeOriginal?: string;
  type?: string;
}

interface SelectedPhoto {
  assetId: string | null;
  id: string | null;
  title: string | null;
  url: string | null;
  createAt: Date | null;
  info: any | null;
}

const PhotoListComponent: React.FC<PhotoListProps> = ({ photosData, combinedData, assertsData }) => {
  const [flowData, setFlowData] = useState(photosData);  // PhotoFlow 数据
  useEffect(() => { setData(photosData); }, [photosData]);

  const [data, setData] = useState(combinedData);  // 当前 PhotoFlow 的合并数据
  useEffect(() => { setData(combinedData); }, [combinedData]);

  const [assertData, setAssertData] = useState(assertsData);  // 所有文件列表的数据
  useEffect(() => { setAssertData(assertsData); }, [assertsData]);

  const [selected, setSelected] = useState<SelectedPhoto>({ // 选中照片的数据
    assetId: null,
    id: null,
    title: null,
    createAt: null,
    url: null,
    info: null,
  });
  useEffect(() => { setSelected(selected); }, [selected]);

  const [visible, setVisible] = useState(false);  // Editor 弹窗的状态

  // handleOk 点击弹窗的「确定」，清理数据，然后进行上传操作
  const handleOk = () => {
    const json = JSON.stringify(selected);
    console.log(json)
    newFlowItem(json);  // 调用新建操作
    setVisible(false);
  };

  // 文件选择列表底部的「上传新文件」按钮
  const outSlotNode = <Link href={'/dashboard/assets'} className='block w-full text-indigo-500 my-2 text-center font-bold'>上传新文件</Link>

  // Render function for the selected item in the Select dropdown.
  const renderSelectedItem = (optionNode: any) => (
    <>{optionNode.label}</>
  )

  // When change the selected item, update the selected data
  const selectOnChange = (value: any) => {
    const selectedAsset = assertData.find((item: any) => item.assetId === value);
    console.log(selectedAsset)
    if (selectedAsset) {
      setSelected(prevSelected => ({
        ...prevSelected,
        assetId: selectedAsset.assetId,
        url: selectedAsset.url,
        info: {
          ...prevSelected.info,
          originExif: {
            width: selectedAsset.width,
            height: selectedAsset.height,
            DateTimeOriginal: selectedAsset.DateTimeOriginal,
            Make: selectedAsset.Make,
            Model: selectedAsset.Model,
            LensMake: selectedAsset.LensMake,
            LensModel: selectedAsset.LensModel
          }
        }
      }));
    }
  };

  // When change the input value, update the selected data
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>, field: keyof SelectedPhoto) => {
    const value = event;
    setSelected(prevSelected => ({
      ...prevSelected,
      [field]: value
    }));
  };

  const handleExifChange = (event: React.ChangeEvent<HTMLInputElement>, field: keyof ExifData) => {
    const value = event;
    setSelected(prevSelected => ({
      ...prevSelected,
      overExif: {
        ...prevSelected.info.overExif,
        [field]: value
      }
    }));
  };

  // Handling new PhotoFlow items
  const newFlowItem = async (json: string) => {
    try {
      const response = await fetch('/api/newphoto', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: json
      })
      if (response.ok) {
        Toast.success('New flow item created successfully.')
      } else {
        Toast.error('Error creating new flow item.')
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Handling deleted PhotoFlow items
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
    if (data) {
      let info = {
        originExif: data.info.originExif ?? null,
        overExif: data.info.overExif ?? data.originExif ?? null, // 如果 data.overExif 存在则使用，否则使用 data.originExif
        exif: data.exif ?? null
      }
      setSelected({
        assetId: data.assetId ?? null,
        id: data.id ?? null,
        title: data.title ?? null,
        url: data.url ?? null,
        createAt: data.createAt ?? null,
        info: info
      });
    } else {
      // 创建新项目，设置 selected 中的值为 null
      setSelected({
        assetId: null,
        id: null,
        title: null,
        url: null,
        createAt: null,
        info: null
      });
    }
    setVisible(true);
  }

  // PhotoList Item Description
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
            <Card cover={<Image src={item.url} alt={item.title} height={item.info.originExif.height} width={item.info.originExif.width} className='aspect-[4/3] object-cover' unoptimized />}>
              <Meta title={item.title || 'No Title'} />
              <Meta description={itemDescription(item)} />
            </Card>
          </button>
        ))}
        <Modal title="编辑图片" visible={visible} fullScreen
          onOk={handleOk} onCancel={() => setVisible(false)} closeOnEsc={true} closable={false}>
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
                      <Image className='max-h-[120px] max-w-[160px] object-cover ' src={item.url} alt={item.title} width={160} height={160} unoptimized />
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
              <Input size='large' prefix="AssertsID*" className='col-span-2' value={selected.assetId || ''} onChange={(event: any) => handleTitleChange(event, 'assetId')} ></Input>
              <Input size='large' prefix="Title*" defaultValue={selected.title || ''} className='col-span-4' onChange={(event: any) => handleTitleChange(event, 'title')} ></Input>
              <Input size='large' placeholder={selected.info?.originExif?.Make || ''} className='col-span-1' prefix="Make*" onChange={(event: any) => handleExifChange(event, 'Make')}  ></Input>
              <Input size='large' placeholder={selected.info?.originExif?.Model} className='col-span-3' prefix="Model*" onChange={(event: any) => handleExifChange(event, 'Model')} ></Input>
              <Input size='large' placeholder={selected.info?.originExif?.LensMake || ''} className='col-span-3' prefix="LensMake*" onChange={(event: any) => handleExifChange(event, 'LensMake')}></Input>
              <Input size='large' placeholder={selected.info?.originExif?.LensModel} className='col-span-3' prefix="LensModel*" onChange={(event: any) => handleExifChange(event, 'LensModel')}></Input>
            </div>
            <button className='bg-red-500 text-white py-2 px-4 my-6 rounded' onClick={() => deleteItem(selected.id)}>删除</button>
          </div>
        </Modal>
      </div >
    </>
  )

}

export default PhotoListComponent;