import Vue from 'vue'
import './bootstrap'
import PermissionsModal from './PermissionsModal.vue'

import { generateOcsUrl } from '@nextcloud/router'
import { dirname } from '@nextcloud/paths'
import { showError } from '@nextcloud/dialogs'
import axios from '@nextcloud/axios'
import moment from '@nextcloud/moment'

let lastPath = null

function editShare(shareId, permission) {
	const url = generateOcsUrl('/apps/files_sharing/api/v1/shares/{shareId}', { shareId })
	const req = {
		permissions: permission === 'write' ? 3 : undefined,
		expireDate: '',
	}
	axios.put(url, req).then((response) => {
		console.debug('EDIT SUCCESS', response.data?.ocs?.data)
		window.location = response.data?.ocs?.data?.url
	}).catch((error) => {
		console.debug(error)
		showError(t('picker', 'Error while editing the shared access'))
	})
}

function createPublicLink(path, permission) {
	const url = generateOcsUrl('/apps/files_sharing/api/v1/shares')
	const req = {
		path,
		shareType: 3,
		label: '[P] ' + t('picker', 'Picker link') + ' ' + moment().format('YYYY-MM-DD HH:mm:ss'),
	}
	axios.post(url, req).then((response) => {
		console.debug('ADD SUCCESS', response.data?.ocs?.data)
		const shareId = response.data?.ocs?.data?.id
		editShare(shareId, permission)
	}).catch((error) => {
		console.error(error)
		showError(t('picker', 'Error while creating the shared access'))
	})
}

function openFilePicker(permVue) {
	OC.dialogs.filepicker(
		t('picker', 'Choose a file and start collaborating'),
		(targetPath) => {
			// createPublicLink(targetPath)
			permVue.setFilePath(targetPath)
			permVue.setOpen(true)
			lastPath = dirname(targetPath)
		},
		false, null, true, undefined, lastPath
	)
}

document.addEventListener('DOMContentLoaded', (event) => {
	const View = Vue.extend(PermissionsModal)
	const permVue = new View().$mount('#picker')
	permVue.$on('closed', () => {
		openFilePicker(permVue)
	})

	permVue.$on('validate', (filePath, permission) => {
		createPublicLink(filePath, permission)
	})

	openFilePicker(permVue)
})
