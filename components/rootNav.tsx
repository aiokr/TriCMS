'use client'
import React, {createContext, useContext, useState} from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {Nav, Avatar, Dropdown, Collapsible, List} from '@douyinfe/semi-ui'
import {FileIcon, PhotoIcon, SettingIcon} from '@/assets/icons'
import HorizontalNavMenu from './horizontalNavMenu'
import {useRouter} from 'next/navigation'
import {signOut} from '@/app/login/actions'

// 导航内容
const navItem = [
  {itemKey: 'dashboard', text: '仪表盘', link: '/dashboard', icon: <SettingIcon />},
  {itemKey: 'posts', text: '文章', link: '/dashboard/post', icon: <FileIcon />},
  {itemKey: 'draftpapers', text: '稿纸', link: '/dashboard/draftpaper', icon: <FileIcon />},
  {itemKey: 'photos', text: '照片流', link: '/dashboard/flow', icon: <PhotoIcon />},
  {itemKey: 'assets', text: '文件管理', link: '/dashboard/assets', icon: <FileIcon />},
  {itemKey: 'settings', text: '设置', link: '/dashboard/settings', icon: <SettingIcon />}
]

/*
  { itemKey: 'posts', text: '文章管理' },
  { itemKey: 'albums', text: '影集' },
  { itemKey: 'sites', text: '站点管理' },
  { itemKey: 'tags', text: '标签管理' },
  { itemKey: 'categories', text: '分类管理' },
*/

export function navLogo(loginUserAvatar: string, loginUser: any, position: any) {
  return (
    <Dropdown
      position={position}
      render={
        <Dropdown.Menu>
          {loginUser.user === null ? (
            <Dropdown.Item>
              <Link href={'/login'}>登录</Link>
            </Dropdown.Item>
          ) : (
            <Dropdown.Item>
              <button onClick={() => signOut()}>退出</button>
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      }
    >
      <Image src={loginUserAvatar} alt="avatar" width={32} height={32} className="rounded-full" unoptimized />
    </Dropdown>
  )
}

const verticalNavText = <button className="text-xl font-semibold pr-2">FlexType /</button>

// 定义横向导航
export function RenderHorizontal(props: any) {
  const {loginUserAvatar, loginUser} = props
  const [isOpen, setOpen] = useState(false)
  const toggle = () => {
    setOpen(!isOpen)
  }

  const router = useRouter()

  const onClickNavItem = (link: string) => {
    setOpen(false)
    router.push(link)
  }
  const horizontalNavText = (
    <button className="text-xl font-semibold pr-2" onClick={toggle}>
      FlexType /
    </button>
  )
  const collapsed = (
    <div className="md:hidden pt-20">
      <HorizontalNavMenu data={navItem} clickItem={onClickNavItem} />
    </div>
  )
  return (
    <>
      <Nav
        className="inline-flex z-10 md:!hidden absolute"
        mode={'horizontal'}
        header={horizontalNavText}
        onSelect={(key) => console.log(key)}
        footer={navLogo(loginUserAvatar, loginUser, 'bottom')}
      />
      <Collapsible isOpen={isOpen}>{collapsed}</Collapsible>
    </>
  )
}

// 定义纵向导航
export function RenderVertical(props: any) {
  const {loginUserAvatar, loginUser} = props
  const [verticalItems, setverticalItems] = useState(navItem)
  return (
    <Nav
      className="!hidden md:!inline-flex h-screen"
      style={{zIndex: 1}}
      items={verticalItems}
      onSelect={(key) => console.log(key)}
      header={{
        logo: navLogo(loginUserAvatar, loginUser, 'bottomLeft'),
        text: verticalNavText
      }}
      footer={{
        collapseButton: true
      }}
    />
  )
}
