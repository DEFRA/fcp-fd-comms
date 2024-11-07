export default (sequelize, DataTypes) => {
  return sequelize.define('notifyApiRequestFailure', {
    correlationId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    message: { type: DataTypes.JSONB, allowNull: false },
    error: { type: DataTypes.JSONB, allowNull: false }
  },
  {
    tableName: 'notifyApiRequestFailure',
    freezeTableName: true,
    timestamps: false
  })
}
