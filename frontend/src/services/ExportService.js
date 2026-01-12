import { exportEditor } from './exportEditor'
import { exportRemoveBg } from './exportRemoveBg'

export async function exportWorkspace(workspaceStore, format) {
    try {
        if (!workspaceStore.ready) {
            throw new Error('Workspace not ready (Getter missing or type invalid)')
        }

        const type = workspaceStore.activeType
        // ...
        const getPayload = workspaceStore.payloadGetter

        // Validation kỹ hơn
        if (typeof getPayload !== 'function') {
            throw new Error('Payload getter is not a function. Check setWorkspace in editor.vue');
        }

        // Thực thi hàm để lấy dữ liệu thật
        const data = getPayload();

        // Log kiểm tra xem dữ liệu có bị undefined/null/0 không
        console.log('Export Data:', data);

        let blob

        switch (type) {
            case 'editor': {
                if (!data.width || !data.height) {
                    throw new Error(
                        `Invalid editor dimensions: width=${data.width}, height=${data.height}`
                    )
                }

                blob = await exportEditor({
                    ...data,
                    format
                })
                break
            }

            case 'remove-bg': {
                if (!data.resultImage) {
                    throw new Error('RemoveBG has no resultImage')
                }

                blob = await exportRemoveBg({
                    resultImage: data.resultImage,
                    format
                })
                break
            }

            default:
                throw new Error(`Unsupported workspace type: ${type}`)
        }

        if (blob) {
            downloadBlob(blob, format)
        }
    } catch (err) {
        console.error('[ExportWorkspace]', err)
        throw err instanceof Error
            ? err
            : new Error('Export failed')
    }
}

function downloadBlob(blob, format) {
    if (!blob) throw new Error('No blob to download')

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = `export-${Date.now()}.${format}`
    document.body.appendChild(a)
    a.click()

    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

