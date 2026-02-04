const platformClient = require("purecloud-platform-client-v2");

async function run() {
  const client = platformClient.ApiClient.instance;

  client.setEnvironment(platformClient.PureCloudRegionHosts.us_east_1);

  await client.loginClientCredentialsGrant(
    process.env.GENESYS_CLIENT_ID,
    process.env.GENESYS_CLIENT_SECRET
  );

  const architectApi = new platformClient.ArchitectApi();
  const datatableId = process.env.GENESYS_DATATABLE_ID;

  // 1️⃣ Obtener SOLO las KEYS
  const rows = await architectApi.getFlowsDatatableRows(datatableId, {
    pageNumber: 1,
    pageSize: 100
    // showbrief da lo mismo aquí
  });

  console.log('Keys:', rows.entities.map(r => r.key));

  // 2️⃣ Obtener cada fila completa
  for (const row of rows.entities) {
    const fullRow = await architectApi.getFlowsDatatableRow(
      datatableId,
      row.key
    );

    console.log('Fila completa:', {
      key: row.key,
      properties: fullRow.properties
    });
  }
}

run().catch(console.error);