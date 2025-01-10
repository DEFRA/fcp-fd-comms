export default (sequelize, DataTypes) => {
  return sequelize.define('notifyApiRequestSuccess', {
    correlationId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    notifyResponseId: { type: DataTypes.UUID, allowNull: false },
    message: { type: DataTypes.JSONB, allowNull: false },
    status: {
      type: DataTypes.ENUM(
        'created',
        'sending',
        'delivered',
        'permanent-failure',
        'temporary-failure',
        'technical-failure'
      ),
      allowNull: false
    },
    statusUpdatedAt: { type: DataTypes.DATE, allowNull: false },
    completed: { type: DataTypes.DATE, allowNull: true },
    recipient: { type: DataTypes.STRING, allowNull: false }
  },
  {
    tableName: 'notifyApiRequestSuccess',
    freezeTableName: true,
    timestamps: false
  })
}
