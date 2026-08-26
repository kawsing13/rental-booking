'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING, allowNull: false },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      phone: { type: DataTypes.STRING, allowNull: true },
      // Never store plaintext passwords - only the bcrypt hash. The hook
      // below (in services/authService) is responsible for hashing on
      // create/update so this model stays a plain data definition.
      passwordHash: { type: DataTypes.STRING, allowNull: false, field: 'password_hash' },
      role: {
        type: DataTypes.ENUM('customer', 'admin', 'staff'),
        allowNull: false,
        defaultValue: 'customer',
      },
      address: { type: DataTypes.STRING, allowNull: true },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      tableName: 'users',
      underscored: true,
      // Never leak the hash in API responses / console logs.
      defaultScope: { attributes: { exclude: ['passwordHash'] } },
      scopes: { withPassword: { attributes: {} } },
    }
  );

  User.associate = (models) => {
    User.hasMany(models.Booking, { foreignKey: 'customerId', as: 'bookings' });
    User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
    User.hasMany(models.AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
  };

  return User;
};
