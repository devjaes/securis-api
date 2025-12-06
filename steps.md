docker exec -it security-project-sqlserver /opt/mssql-tools18/bin/sqlcmd \
 -S localhost -U sa -P "StrongPassword@123" -C \
 -Q "DROP DATABASE IF EXISTS DocumentManagementDB"

docker cp init-db/01-init.sql security-project-sqlserver:/tmp/init.sql

docker exec -it security-project-sqlserver /opt/mssql-tools18/bin/sqlcmd \
 -S localhost -U sa -P "StrongPassword@123" -C \
 -i /tmp/init.sql

pnpm exec prisma db seed
