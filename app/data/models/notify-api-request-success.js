export default (sequelize, DataTypes) => {
  return sequelize.define('notify_api_request_success', {
    correlation_id: { type: DataTypes.UUID, primaryKey: true },
    created_at: { type: DataTypes.DATE },
    notify_response_id: { type: DataTypes.STRING },
    message: { type: DataTypes.JSONB },
    status: {
      type: DataTypes.ENUM(
        'created',
        'sending',
        'delivered',
        'permanent-failure',
        'temporary-failure',
        'technical-failure'
      )
    },
    status_updated_at: { type: DataTypes.DATE },
    completed: { type: DataTypes.DATE }
  },
  {
    tableName: 'notify_api_request_success',
    freezeTableName: true,
    timestamps: false
  })
}
