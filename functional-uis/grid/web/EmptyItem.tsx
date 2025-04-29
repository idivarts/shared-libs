import React from 'react'
import { DraggableItemStyle } from './DraggableItem.style'

const EmptyItem: React.FC<{ index: number, handleAddAsset: any }> = ({ index, handleAddAsset }) => {
    return (
        <div
            key={`empty-${index}`}
            style={{
                ...DraggableItemStyle.card,
                alignItems: 'center',
                aspectRatio: '1',
                backgroundColor: '#f5f5f5',
                border: '2px solid #15293f',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'center',
                position: 'relative',
            }}
        >
            <label
                htmlFor={`file-upload-${index}`}
                style={{
                    alignItems: 'center',
                    cursor: 'pointer',
                    display: 'flex',
                    height: '100%',
                    justifyContent: 'center',
                    width: '100%',
                }}
            >
                <span
                    style={{
                        color: '#15293f',
                        fontSize: '32px',
                    }}
                >
                    +
                </span>
                <input
                    id={`file-upload-${index}`}
                    type="file"
                    accept="image/*, video/*"
                    onChange={handleAddAsset}
                    style={{
                        height: 0,
                        opacity: 0,
                        position: 'absolute',
                        width: 0,
                    }}
                />
            </label>
        </div>
    )
}

export default EmptyItem