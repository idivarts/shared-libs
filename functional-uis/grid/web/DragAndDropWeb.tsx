// import { useAuthContext } from '@/contexts';
import { useAWSContext } from "@/shared-libs/contexts/aws-context.provider";
import { Attachment } from '@/shared-libs/firestore/trendly-pro/constants/attachment';
import { processRawAttachment } from '@/shared-uis/utils/attachments';
import { WebAssetItem } from '@/types/Asset';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { useState } from 'react';
import DraggableItem from './DraggableItem';
import EmptyItem from './EmptyItem';
import SortableItem from './SortableItem';

interface DragAndDropWebProps {
  attachments: Attachment[];
  onAttachmentChange: (attachments: Attachment[]) => void;
}

const DragAndDropWeb: React.FC<DragAndDropWebProps> = ({ attachments, onAttachmentChange }) => {
  const [assets, setAssets] = useState(attachments.map((a, index): WebAssetItem => ({
    ...processRawAttachment(a),
    id: "" + index,
  })))
  const [myAttachments, setMyAttachments] = useState(attachments.reduce((acc: any, value, index) => {
    acc[index] = value;
    return acc;
  }, {}))
  const [activeId, setActiveId] = useState<string | null>(null)
  // const { user, updateUser } = useAuthContext()
  const { uploadFile } = useAWSContext()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    // active.id

    let newAssets = assets;
    if (over && active.id !== over.id) {
      const oldIndex = assets.findIndex((asset) => asset.id === active.id)
      const newIndex = assets.findIndex((asset) => asset.id === over.id)
      newAssets = arrayMove(assets, oldIndex, newIndex)
      setAssets([...newAssets])
    }
    setActiveId(null);
    orderAndUpload(newAssets, myAttachments)
  }

  const handleRemoveAsset = (id: string) => {
    const newAssets = assets.filter((asset) => asset.id !== id);
    setAssets([...newAssets]);

    delete myAttachments[parseInt(id)]
    setMyAttachments({ ...myAttachments })
    orderAndUpload(newAssets, myAttachments)
  }

  const handleAddAsset = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const id = assets.length
      assets.push({
        id: "" + id,
        url: file,
        type: file.type.includes('video') ? 'video' : 'image',
      })
      setAssets([...assets])
      const uploadedAsset = await uploadFile(file)
      assets[id].url = processRawAttachment(uploadedAsset).url
      setAssets([...assets])
      myAttachments[id] = uploadedAsset
      setMyAttachments({ ...myAttachments })
    }
    orderAndUpload(assets, myAttachments)
  }


  const orderAndUpload = (assets: WebAssetItem[], myAttachments: any) => {
    const assetOrder = assets.filter(a => !!a.url).map(a => a.id)
    console.log("Order and Upload", assetOrder, "\n", myAttachments);
    let newAttachments: Attachment[] = []
    for (let i = 0; i < assetOrder.length; i++) {
      const id = assetOrder[i];
      newAttachments.push(myAttachments["" + id])
    }
    console.log("New Attachments", newAttachments);
    onAttachmentChange(newAttachments)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        style={{
          display: 'grid',
          gap: '20px',
          gridTemplateColumns: 'repeat(3, 1fr)',
          justifyItems: 'center',
          margin: '0 auto',
          maxWidth: '900px',
          padding: '20px',
        }}
      >
        <SortableContext
          items={assets.map((asset) => asset.id as string)}
          strategy={rectSortingStrategy}
        >
          {assets.map((asset) => (
            <SortableItem
              key={asset.id}
              id={asset.id as string}
              asset={asset}
              onRemove={() => handleRemoveAsset(asset.id as string)}
            />
          ))}
          {Array.from({ length: 6 - assets.length }).map((_, index) => (
            <EmptyItem index={index} handleAddAsset={handleAddAsset} />
          ))}
        </SortableContext>

        <DragOverlay>
          {activeId ? (
            <DraggableItem
              asset={assets.find((asset) => asset.id === activeId) as WebAssetItem}
              id={activeId}
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  )
}

export default DragAndDropWeb;
