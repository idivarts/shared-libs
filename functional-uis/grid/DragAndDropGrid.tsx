import { Attachment } from '@/shared-libs/firestore/trendly-pro/constants/attachment';
import React, { FC } from 'react';
import { Platform } from 'react-native';
import DragAndDropNative from './native/DragAndDropNative';
import DragAndDropWeb from './web/DragAndDropWeb';

interface DragAndDropWebProps {
    attachments: Attachment[];
    onAttachmentChange: (attachments: Attachment[]) => void;
}

const DragAndDropGrid: FC<DragAndDropWebProps> = ({ attachments, onAttachmentChange }) => {
    return (
        <>
            {
                Platform.OS === 'web' ? (
                    <DragAndDropWeb
                        attachments={attachments}
                        onAttachmentChange={onAttachmentChange}
                    />
                ) : (
                    <DragAndDropNative
                        attachments={attachments}
                        onAttachmentChange={onAttachmentChange}
                    />
                )
            }
        </>
    )
}

export default DragAndDropGrid