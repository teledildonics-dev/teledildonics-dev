use buttplug;
use buttplug::client::{connector::ButtplugEmbeddedClientConnector, ButtplugClient};

use futures;

async fn async_main() {
    let connector = ButtplugEmbeddedClientConnector::new("Icy Server", 0);
    let mut client = ButtplugClient::new("Icy Client");

    client
        .connect(connector)
        .await
        .expect("embedded connection to immediately activate");
}

fn main() {
    futures::executor::block_on(async { async_main().await });
}
