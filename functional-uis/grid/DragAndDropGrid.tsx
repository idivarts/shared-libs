import { Attachment } from '@/shared-libs/firestore/trendly-pro/constants/attachment';
import React, { FC } from 'react';
import { Platform } from 'react-native';
import DragAndDropNative from './native/DragAndDropNative';
import DragAndDropWeb from './web/DragAndDropWeb';

interface DragAndDropWebProps {
    attachments: Attachment[];
    onAttachmentChange: (attachments: Attachment[]) => void;
    onLoadStateChange?: (isLoading: boolean) => void;
}

const DragAndDropGrid: FC<DragAndDropWebProps> = ({ attachments, onAttachmentChange, onLoadStateChange }) => {
    return (
        <>
            {
                Platform.OS === 'web' ? (
                    <DragAndDropWeb
                        attachments={attachments}
                        onAttachmentChange={onAttachmentChange}
                        onLoadStateChange={onLoadStateChange}
                    />
                ) : (
                    <DragAndDropNative
                        attachments={attachments}
                        onAttachmentChange={onAttachmentChange}
                        onLoadStateChange={onLoadStateChange}
                    />
                )
            }
        </>
    )
}

export default DragAndDropGrid