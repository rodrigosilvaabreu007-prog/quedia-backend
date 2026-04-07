const id = '69d5365054eb9a1f12b40184';
const url = `https://eventhub-api-649702844549.us-central1.run.app/api/eventos/${id}`;
(async () => {
  try {
    const res = await fetch(url);
    console.log('status', res.status, res.statusText);
    const data = await res.text();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
})();
