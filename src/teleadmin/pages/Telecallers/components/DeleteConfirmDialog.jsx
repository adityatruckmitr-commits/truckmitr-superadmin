const DeleteConfirmDialog = ({ onClose, onConfirm }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Delete</h3>
      <p className="text-gray-600 mb-6">
        Are you sure you want to delete this telecaller? Transfer their leads first!
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

export default DeleteConfirmDialog;
