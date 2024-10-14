export default (sequelize, DataTypes) => {
  return sequelize.define('initial', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    message: DataTypes.STRING
  },
  {
    tableName: 'initial',
    freezeTableName: true,
    timestamps: false
  })
}
