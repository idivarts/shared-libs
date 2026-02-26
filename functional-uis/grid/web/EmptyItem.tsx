import React, { useMemo } from 'react'
import { useTheme } from '@react-navigation/native'
import { getDraggableItemStyle } from './DraggableItem.style'
import Colors from '@/shared-uis/constants/Colors'

const EmptyItem: React.FC<{ index: number, handleAddAsset: any }> = ({ index, handleAddAsset }) => {
    const theme = useTheme();
    const DraggableItemStyle = useMemo(() => getDraggableItemStyle(theme), [theme]);
    const colors = useMemo(() => Colors(theme), [theme]);

    return (
        <div
            key={`empty-${index}`}
            style={{
                ...DraggableItemStyle.card,
                alignItems: 'center',
                aspectRatio: '1',
                backgroundColor: colors.gray200,
                border: `2px solid ${colors.primary}`,
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
                        color: colors.primary,
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