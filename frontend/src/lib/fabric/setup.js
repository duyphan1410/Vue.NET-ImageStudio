import { FabricObject } from 'fabric';

export function setupFabric() {
    FabricObject.customProperties = [
        'editorId',
        'selectable',
        'evented'
    ];
}
