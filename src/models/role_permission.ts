import { Model, DataTypes } from 'sequelize';
import type {
    Sequelize,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional
} from 'sequelize';

export class RolePermission extends Model<
    InferAttributes<RolePermission>,
    InferCreationAttributes<RolePermission>
> {
    declare id: CreationOptional<number>;
    declare role_id: number;
    declare permission_id: number;
    declare created_at: CreationOptional<Date>;
    declare updated_at: CreationOptional<Date>;
    
    static associate(models: any) {
        // Link to the Role
        RolePermission.belongsTo(models.Role, {
            foreignKey: 'role_id',
            as: 'role'
        });
    
        // Link to the Permission
        RolePermission.belongsTo(models.Permission, {
            foreignKey: 'permission_id',
            as: 'permission'
        });
    }
}

export default (sequelize: Sequelize) => {
    RolePermission.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            role_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            permission_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            tableName: 'role_permissions',
            underscored: true,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    return RolePermission
}