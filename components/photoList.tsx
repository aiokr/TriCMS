'use client'
import * as React from 'react'
import {useState, useEffect, useCallback} from 'react'
import {Rating, Input, Toast, Select, Modal, DatePicker, Card} from '@douyinfe/semi-ui'
import Image from 'next/image'
import Link from 'next/link'
import Map, {Marker, NavigationControl, GeolocateControl} from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@/components/mapbox-gl-geocoder.css'
import GeocoderControl from '@/components/geocoder-control'
import type {LngLat} from 'react-map-gl'
import convertDMSToDecimal from '@/libs/convertDMSToDecimal'
import {autoRevalidate} from '@/app/actions'

const {Meta} = Card

interface PhotoListProps {
  photosData: any
  assertsData: any
  combinedData: any
}

interface ExifData {
  Make?: string
  Model?: string
  LensMake?: string
  LensModel?: string
  width?: number
  height?: number
  DateTimeOriginal?: string
  type?: string
  GPSLongitude?: string
  GPSLatitude?: string
}

interface SelectedPhoto {
  assetId: string | null
  id: string | null
  title: string | null
  url: string | null
  createAt: Date | null
  info: any | null
}

interface Info {
  rating: number | null
}

const PhotoListComponent: React.FC<PhotoListProps> = ({photosData, combinedData, assertsData}) => {
  const [flowData, setFlowData] = useState(photosData) // PhotoFlow 数据
  useEffect(() => {
    setData(photosData)
  }, [photosData])

  const [data, setData] = useState(combinedData.sort((a: any, b: any) => b.createAt - a.createAt)) // 当前 PhotoFlow 的合并数据
  useEffect(() => {
    setData(combinedData)
  }, [combinedData])
  // console.log(data)

  const [assertData, setAssertData] = useState(assertsData) // 所有文件列表的数据
  useEffect(() => {
    setAssertData(assertsData)
  }, [assertsData])

  const [selected, setSelected] = useState<SelectedPhoto>({
    // 选中照片的数据
    assetId: null,
    id: null,
    title: null,
    createAt: null,
    url: null,
    info: null
  })
  useEffect(() => {
    setSelected(selected)
  }, [selected])

  const [visible, setVisible] = useState(false) // Editor 弹窗的状态

  const [events, logEvents] = useState<Record<string, LngLat>>({})

  // handleOk 点击弹窗的「确定」，清理数据，然后进行上传操作
  const handleOk = () => {
    const json = JSON.stringify(selected)
    // console.log(json)
    newFlowItem(json) // 调用新建操作
    setVisible(false)
  }

  // 文件选择列表底部的「上传新文件」按钮
  const outSlotNode = (
    <Link href={'/dashboard/assets'} className="block w-full text-indigo-500 my-2 text-center font-bold">
      上传新文件
    </Link>
  )

  // Render function for the selected item in the Select dropdown.
  const renderSelectedItem = (optionNode: any) => <>{optionNode.label}</>

  // When change the selected item, update the selected data
  const selectOnChange = (value: any) => {
    const selectedAsset = assertData.find((item: any) => item.assetId === value)
    // console.log('selectedAsset' + selectedAsset)
    if (selectedAsset) {
      setSelected((prevSelected) => ({
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
            LensModel: selectedAsset.LensModel,
            GPSLatitude: convertDMSToDecimal(selectedAsset.GPSLatitude),
            GPSLongitude: convertDMSToDecimal(selectedAsset.GPSLongitude)
          }
        }
      }))
    }
  }

  // When change the input value, update the selected data
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>, field: keyof SelectedPhoto) => {
    const value = event
    setSelected((prevSelected) => ({
      ...prevSelected,
      [field]: value
    }))
  }

  const handleInfoChange = (event: React.ChangeEvent<HTMLInputElement>, field: keyof Info) => {
    const value = event
    setSelected((prevSelected) => ({
      ...prevSelected,
      info: {
        ...prevSelected.info,
        [field]: value
      }
    }))
  }

  const handleExifChange = (event: React.ChangeEvent<HTMLInputElement>, field: keyof ExifData) => {
    const value = event // 获取输入框的值
    setSelected((prevSelected) => ({
      ...prevSelected,
      info: {
        ...prevSelected.info,
        overExif: {
          ...prevSelected.info.overExif,
          [field]: value
        }
      }
    }))
  }

  const handleLocationClean = (selected: SelectedPhoto) => {
    setSelected((prevSelected) => ({
      ...prevSelected,
      info: {
        ...prevSelected.info,
        overExif: {
          ...prevSelected.info.overExif,
          GPSLongitude: selected.info.originExif.GPSLongitude ?? null,
          GPSLatitude: selected.info.originExif.GPSLatitude ?? null
        }
      }
    }))
  }

  // Handling new PhotoFlow items
  const newFlowItem = async (json: string) => {
    try {
      const response = await fetch('/api/newflow', {
        method: 'PUT',
        // headers: { 'Content-Type': 'application/json',},
        body: json
      })
      if (response.ok) {
        autoRevalidate()
        console.log(response)
        Toast.success(`Flow item edited successfully.`)
      } else {
        console.log(response)
        Toast.error(`Error creating new flow item.}`)
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
        autoRevalidate()
        Toast.success(`ID ${id} deleted successfully.`)
        setVisible(false)
      } else {
        Toast.error('Error deleting file.')
        setVisible(false)
      }
    } catch (error) {
      console.error(error)
      setVisible(false)
    }
  }

  // Open PhotoFlow Item Editor
  const openPhotoEditor = (data: any) => {
    if (data) {
      let info = {
        originExif: data.info.originExif ?? null,
        overExif: data.info.overExif ?? data.originExif ?? null, // 如果 data.overExif 存在则使用，否则使用 data.originExif
        rating: data.info.rating ?? null,
        exif: data.exif ?? null
      }
      setSelected({
        assetId: data.assetId ?? null,
        id: data.id ?? null,
        title: data.title ?? null,
        url: data.url ?? null,
        createAt: data.createAt ?? null,
        info: info
      })
    } else {
      // 创建新项目，设置 selected 中的值为 null
      setSelected({
        assetId: null,
        id: null,
        title: null,
        url: null,
        createAt: null,
        info: null
      })
    }
    setVisible(true)
  }

  // After close PhotoFlow Item Editor
  const handleAfterClose = () => {
    autoRevalidate()
    console.log('After Close callback executed')
  }

  // PhotoList Item Description
  const itemDescription = (item: any) => {
    return (
      <div className="text-xs flex flex-col items-start gap-1 pt-1">
        <div className="text-xs text-left truncate">
          <span>{item.info.originExif.Make} </span>
          <span>{item.info.originExif.Model} </span>
          <span>{item.info.originExif.LensMake} </span>
          <span>{item.info.originExif.LensModel} </span>
        </div>
        <p className="text-xs text-left">
          {new Date(item.createAt || item.info.originExif.DateTimeOriginal).toLocaleString('default', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            minute: '2-digit',
            hour: '2-digit'
          })}
          <span className="ml-2"> Rating: {item.info.rating}</span>
        </p>
      </div>
    )
  }

  return (
    <>
      {/* PhotoFlow List */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 px-1 md:px-0">
        <button className="border rounded-[6px] w-full h-full" onClick={() => openPhotoEditor(null)}>
          新建项目
        </button>
        {data.map((item: any) => (
          <button key={item.id} onClick={() => openPhotoEditor(item)}>
            <Card
              cover={
                <Image
                  src={item.url}
                  alt={item.title}
                  height={item.info.originExif.height}
                  width={item.info.originExif.width}
                  className="aspect-[4/3] object-cover"
                  unoptimized
                />
              }
            >
              <Meta title={item.title || 'No Title'} className="text-left truncate" />
              <Meta description={itemDescription(item)} />
            </Card>
          </button>
        ))}
      </div>
      {/* PhotoFlow Item Editor */}
      <Modal
        title="编辑图片"
        visible={visible}
        fullScreen
        afterClose={handleAfterClose}
        onOk={handleOk}
        onCancel={() => setVisible(false)}
        closeOnEsc={true}
        closable={false}
        bodyStyle={{overflow: 'auto'}}
      >
        <div className="container mx-auto max-w-[800px]">
          <div>
            <Select
              onChange={selectOnChange}
              style={{width: '100%', height: '140px'}}
              dropdownStyle={{width: '100%'}}
              outerBottomSlot={outSlotNode}
              renderSelectedItem={renderSelectedItem}
              value={selected.assetId || undefined}
            >
              {assertData.map((item: any) => (
                <Select.Option key={item.assetId} value={item.assetId} className="flex gap-2">
                  <div className="flex gap-2">
                    <Image className="max-h-[120px] max-w-[160px] object-cover " src={item.url} alt={item.title} width={160} height={160} unoptimized />
                    <div>
                      <div className="font-bold">{item.assetId + ' - ' + item.title}</div>
                      <div>{new Date(item.DateTimeOriginal).toLocaleString('zh-CN')}</div>
                      <div>{item.Make + ' - ' + item.Model}</div>
                      <div>{item.LensModel}</div>
                    </div>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-4 gap-4 my-4">
            <Input size="large" prefix="PhotoFlowID*" className="col-span-4 md:col-span-2" value={selected.id || ''} disabled></Input>
            <Input
              size="large"
              prefix="AssertsID*"
              className="col-span-4 md:col-span-2"
              value={selected.assetId || ''}
              onChange={(event: any) => handleTitleChange(event, 'assetId')}
            ></Input>
            <Input
              size="large"
              prefix="Title*"
              defaultValue={selected.title || ''}
              className="col-span-4"
              onChange={(event: any) => handleTitleChange(event, 'title')}
            ></Input>
            <Input
              size="large"
              value={selected.info?.overExif?.Make || selected.info?.originExif?.Make || ''}
              className="col-span-4 md:col-span-1"
              prefix="Make*"
              onChange={(event: any) => handleExifChange(event, 'Make')}
            ></Input>
            <Input
              size="large"
              value={selected.info?.overExif?.Model || selected.info?.originExif?.Model}
              className="col-span-4 md:col-span-3"
              prefix="Model*"
              onChange={(event: any) => handleExifChange(event, 'Model')}
            ></Input>
            <Input
              size="large"
              value={selected.info?.overExif?.LensMake || selected.info?.originExif?.LensMake || ''}
              className="col-span-4"
              prefix="LensMake*"
              onChange={(event: any) => handleExifChange(event, 'LensMake')}
            ></Input>
            <Input
              size="large"
              value={selected.info?.overExif?.LensModel || selected.info?.originExif?.LensModel}
              className="col-span-4"
              prefix="LensModel*"
              onChange={(event: any) => handleExifChange(event, 'LensModel')}
            ></Input>
            <DatePicker
              size="large"
              type="dateTime"
              value={selected.info?.overExif?.DateTimeOriginal || selected.info?.originExif?.DateTimeOriginal}
              className="col-span-4"
              onChange={(event: any) => handleExifChange(event, 'DateTimeOriginal')}
            />
          </div>
          <div className="w-full my-4">
            <Rating
              className="my-0 mx-auto"
              defaultValue={selected.info?.rating || 0}
              value={selected.info?.rating}
              onChange={(event: any) => handleInfoChange(event, 'rating')}
            />
          </div>
          <div className="my-4">
            <div>
              <Map
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
                initialViewState={{
                  longitude: selected.info?.overExif?.GPSLongitude || selected.info?.originExif?.GPSLongitude || 0,
                  latitude: selected.info?.overExif?.GPSLatitude || selected.info?.originExif?.GPSLatitude || 0,
                  zoom: parseFloat(selected.info?.overExif?.GPSLatitude || selected.info?.originExif?.GPSLatitude) === 0 ? 5 : 12 // 如果经纬度为 0 则缩放为 5，否则缩放为 12
                }}
                style={{position: 'relative', width: '100%', height: '400px', display: 'block'}}
                mapStyle="mapbox://styles/aiokr/clv6uhepi00lg01og9zb2fh18"
                attributionControl={false}
                onClick={(e: any) => {
                  const {lng, lat} = e.lngLat
                  setSelected((prevSelected) => ({
                    ...prevSelected,
                    info: {
                      ...prevSelected.info,
                      overExif: {
                        ...prevSelected.info.overExif,
                        GPSLongitude: lng.toFixed(6).toString(),
                        GPSLatitude: lat.toFixed(6).toString()
                      }
                    }
                  }))
                }}
              >
                <GeolocateControl position="top-left" />
                <NavigationControl position="top-left" visualizePitch={false} />
                <Marker
                  longitude={selected.info?.overExif?.GPSLongitude || selected.info?.originExif?.GPSLongitude || 0}
                  latitude={selected.info?.overExif?.GPSLatitude || selected.info?.originExif?.GPSLatitude || 0}
                  anchor="bottom"
                />
                <GeocoderControl position="top-right" mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN} />
              </Map>
              <div className="w-full my-2 flex justify-between items-center text-sm">
                <div className="flex gap-2">
                  <Input
                    value={selected.info?.overExif?.GPSLatitude || selected.info?.originExif?.GPSLatitude || 0}
                    prefix={'Latitude'}
                    onChange={(e: any) => {
                      setSelected((prevSelected) => ({
                        ...prevSelected,
                        info: {
                          ...prevSelected.info,
                          overExif: {
                            ...prevSelected.info.overExif,
                            GPSLatitude: e
                          }
                        }
                      }))
                    }}
                  ></Input>
                  <Input
                    value={selected.info?.overExif?.GPSLongitude || selected.info?.originExif?.GPSLongitude || 0}
                    prefix={'Longitude'}
                    onChange={(e: any) => {
                      setSelected((prevSelected) => ({
                        ...prevSelected,
                        info: {
                          ...prevSelected.info,
                          overExif: {
                            ...prevSelected.info.overExif,
                            GPSLongitude: e
                          }
                        }
                      }))
                    }}
                  ></Input>
                </div>
                <button className="bg-gray-300 text-white py-1 px-4 rounded" onClick={() => handleLocationClean(selected)}>
                  Reset Location
                </button>
              </div>
            </div>
          </div>
          <button className="bg-red-500 text-white py-2 px-4 my-6 rounded" onClick={() => deleteItem(selected.id)}>
            删除
          </button>
        </div>
      </Modal>
    </>
  )
}

export default PhotoListComponent
