import { Model, DataTypes } from 'sequelize';
import type {
    Sequelize,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from 'sequelize';


export class Permission extends Model<
    InferAttributes<Permission>,
    InferCreationAttributes<Permission>
> {
    declare id: CreationOptional<number>;
    declare name: string;
    declare description: string | null;
    declare module: string;
    declare created_at: CreationOptional<Date>;
    declare updated_at: CreationOptional<Date>;

    // Helper for Many-to-Many associations
    static associate(models: any) {
        Permission.belongsToMany(models.Role, {
            through: 'role_permissions',
            foreignKey: 'permission_id',
            otherKey: 'role_id',
            as: 'roles'
        });
    }
}

export default (sequelize: Sequelize) => {
    Permission.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    notEmpty: true,
                    // Enforce snake_case for consistency with your RBAC logic
                    is: /^[a-z_]+$/i,
                },
            },
            description: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            module: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
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
            tableName: 'permissions',
            underscored: true, // Automatically handles created_at -> createdAt mapping
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    return Permission;
}