import { HomeIcon } from '@heroicons/react/24/outline';
import { FolderIcon } from '@heroicons/react/24/outline';
import DashboardsIcon from 'assets/dualicons/dashboards.svg?react'
import { NAV_TYPE_ROOT, NAV_TYPE_ITEM } from 'constants/app.constant'

const ROOT_DASHBOARDS = '/dashboards'

const path = (root, item) => `${root}${item}`;

export const dashboards = {
    id: 'dashboards',
    type: NAV_TYPE_ROOT,
    path: '/dashboards',
    title: 'Ask Innovation',
    Icon: DashboardsIcon,
    childs: [
        {
            id: 'dashboards.home',
            path: path(ROOT_DASHBOARDS, '/home'),
            type: NAV_TYPE_ITEM,
            title: 'Dashboard',
            Icon: HomeIcon,
        },
        {
            id: 'dashboards.allproject',
            path: path(ROOT_DASHBOARDS, '/allproject'),
            type: NAV_TYPE_ITEM,
            title: 'All Project',
            Icon: FolderIcon,
        },
        {
            id: 'dashboards.alpha-crm',
            type: NAV_TYPE_ITEM,
            title: 'Real estate CRM',
            showBullet: true,
            isStatic: true,
        },
        {
            id: 'dashboards.beta-mobile',
            type: NAV_TYPE_ITEM,
            title: 'DTG Tampa',
            showBullet: true,
            isStatic: true,
        },
        {
            id: 'dashboards.website-redesign',
            type: NAV_TYPE_ITEM,
            title: 'Divya Santan',
            showBullet: true,
            isStatic: true,
        },
        {
            id: 'dashboards.ecommerce-platform',
            type: NAV_TYPE_ITEM,
            title: 'Ask_Innovation',
            showBullet: true,
            isStatic: true,
        },
        {
            id: 'dashboards.internal-portal',
            type: NAV_TYPE_ITEM,
            title: 'Polystox',
            showBullet: true,
            isStatic: true,
        },
        {
            id: 'dashboards.mobile-banking',
            type: NAV_TYPE_ITEM,
            title: 'Kailtech',
            showBullet: true,
            isStatic: true,
        },
        {
            id: 'dashboards.krl',
            type: NAV_TYPE_ITEM,
            title: 'KRL',
            showBullet: true,
            isStatic: true,
        },
        {
            id: 'dashboards.kanishk',
            type: NAV_TYPE_ITEM,
            title: 'Kanishk',
            showBullet: true,
            isStatic: true,
        },
        {
            id: 'dashboards.shaleen',
            type: NAV_TYPE_ITEM,
            title: 'Shaleen Overseas',
            showBullet: true,
            isStatic: true,
        },
        {
            id: 'dashboards.tgtx',
            type: NAV_TYPE_ITEM,
            title: 'TGTX',
            showBullet: true,
            isStatic: true,
        },
        {
            id: 'dashboards.wayda',
            type: NAV_TYPE_ITEM,
            title: "Way'da",
            showBullet: true,
            isStatic: true,
        },
        {
            id: 'dashboards.nutrition',
            type: NAV_TYPE_ITEM,
            title: 'Nutrition Tracker',
            showBullet: true,
            isStatic: true,
        },
    ]
}
