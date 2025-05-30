// import { useAuthContext } from '@/contexts';
import { useAWSContext } from "@/shared-libs/contexts/aws-context.provider";
import { Attachment } from '@/shared-libs/firestore/trendly-pro/constants/attachment';
import { WebAssetItem } from '@/shared-libs/types/Asset';
import { processRawAttachment } from '@/shared-libs/utils/attachments';
import { Console } from "@/shared-libs/utils/console";
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
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { Text, View } from "react-native";
import DraggableItem from './DraggableItem';
import EmptyItem from './EmptyItem';
import SortableItem from './SortableItem';

interface DragAndDropWebProps {
  attachments: Attachment[];
  onAttachmentChange: (attachments: Attachment[]) => void;
  onLoadStateChange?: (isLoading: boolean) => void;
}

const DragAndDropWeb: React.FC<DragAndDropWebProps> = ({ attachments, onAttachmentChange, onLoadStateChange }) => {
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
  const theme = useTheme();

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
    onLoadStateChange?.(true)
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    onLoadStateChange?.(true)
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
    onLoadStateChange?.(true)
    const newAssets = assets.filter((asset) => asset.id !== id);
    setAssets([...newAssets]);

    delete myAttachments[parseInt(id)]
    setMyAttachments({ ...myAttachments })
    orderAndUpload(newAssets, myAttachments)
  }

  const handleAddAsset = async (event: React.ChangeEvent<HTMLInputElement>) => {
    onLoadStateChange?.(true)
    const file = event.target.files?.[0]
    if (file) {
      const id = assets.length
      assets.push({
        id: "" + id,
        url: file,
        type: file.type.includes('video') ? 'video' : 'image',
      })
      setAssets([...assets])
      const uploadedAsset = await uploadFile(file).catch((error) => { })
      if (uploadedAsset) {
        assets[id].url = processRawAttachment(uploadedAsset).url
      }
      // assets[id].url = processRawAttachment(uploadedAsset).url
      setAssets([...assets])
      myAttachments[id] = uploadedAsset
      setMyAttachments({ ...myAttachments })
      if (!uploadedAsset) {
        handleRemoveAsset("" + id)
        return;
      }
    }
    orderAndUpload(assets, myAttachments)
  }


  const orderAndUpload = (assets: WebAssetItem[], myAttachments: any) => {
    const assetOrder = assets.filter(a => !!a.url).map(a => a.id)
    Console.log("Order and Upload", assetOrder, "\n", myAttachments);
    let newAttachments: Attachment[] = []
    for (let i = 0; i < assetOrder.length; i++) {
      const id = assetOrder[i];
      newAttachments.push(myAttachments["" + id])
    }
    Console.log("New Attachments", newAttachments);
    onLoadStateChange?.(false)
    onAttachmentChange(newAttachments)
  }

  return (
    <>
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
      <View style={{ padding: 16 }}>
        <Text style={{ color: theme.dark ? '#fff' : '#000', textAlign: 'center' }}>
          Upload images and videos that best describes your content style
        </Text>
      </View>
    </>
  )
}

export default DragAndDropWeb;
