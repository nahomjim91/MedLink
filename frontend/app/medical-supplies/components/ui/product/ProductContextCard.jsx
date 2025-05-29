import { X } from "lucide-react";

// /components/ui/product/ProductContextCard.jsx
export const ProductContextCard = ({ productData, onRemove, isPreview = false }) => {
  if (!productData) return null;

  return (
    <div className={`p-4 border border-gray-200 bg-gray-50 flex items-center gap-4 ${
      isPreview ? 'border-b' : 'rounded-lg mb-3'
    }`}>
      <img
        src={productData.imageUrl}
        alt={productData.title}
        className="w-16 h-16 rounded-md object-cover"
        onError={(e) => {
          e.target.src = '/placeholder-product.png';
        }}
      />
      <div className="flex-1">
        <h3 className="font-semibold text-sm">{productData.title}</h3>
        <p className="text-sm text-gray-600">${productData.price}</p>
        <p className="text-xs text-primary">
          {productData.stock > 0 ? `${productData.stock} In Stock` : 'Out of Stock'}
        </p>
        {productData.category && (
          <p className="text-xs text-gray-500">{productData.category}</p>
        )}
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="p-1 hover:bg-gray-200 rounded-full"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      )}
    </div>
  );
};