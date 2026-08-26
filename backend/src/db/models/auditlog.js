'use strict';

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      // Null means a system action (e.g. an automated cleanup job) rather
      // than something a specific logged-in user did.
      userId: { type: DataTypes.UUID, allowNull: true, field: 'user_id' },
      action: { type: DataTypes.STRING, allowNull: false },
      entityType: { type: DataTypes.STRING, allowNull: false, field: 'entity_type' },
      entityId: { type: DataTypes.STRING, allowNull: true, field: 'entity_id' },
      details: { type: DataTypes.JSONB, allowNull: true },
    },
    {
      tableName: 'audit_logs',
      underscored: true,
      updatedAt: false,
    }
  );

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return AuditLog;
};
