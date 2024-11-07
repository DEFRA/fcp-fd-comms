export default (sequelize, DataTypes) => {
  return sequelize.define('notify_api_request_failure', {
    correlation_id: { type: DataTypes.UUID, primaryKey: true },
    created_at: { type: DataTypes.DATE },
    message: { type: DataTypes.JSONB },
    error: { type: DataTypes.JSONB }
  },
  {
    tableName: 'notify_api_request_failure',
    freezeTableName: true,
    timestamps: false
  })
}
