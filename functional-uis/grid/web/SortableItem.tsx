import { WebAssetItem } from '@/types/Asset';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useTheme } from '@react-navigation/native';
import { useMemo } from 'react';
import DraggableItem from './DraggableItem';
import { getDraggableItemStyle } from './DraggableItem.style';

interface SortableItemProps {
    id: string;
    asset: WebAssetItem;
    onRemove: () => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
    id,
    asset,
    onRemove,
}) => {
    const theme = useTheme();
    const DraggableItemStyle = useMemo(() => getDraggableItemStyle(theme), [theme]);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={{
                ...DraggableItemStyle.container,
                ...style,
            }}
        >
            <DraggableItem id={id} asset={asset} listeners={listeners} attributes={attributes} />
            {typeof asset.url == "string" && <button
                onClick={onRemove}
                style={{
                    ...DraggableItemStyle.button
                }}
            >
                <FontAwesomeIcon
                    icon={faClose}
                    color={DraggableItemStyle.button.color}
                />
            </button>}
        </div>
    );
};

export default SortableItem;
