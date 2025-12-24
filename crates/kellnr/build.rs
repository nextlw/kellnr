use std::path::Path;

fn main() {
    // Resolve the path to ui/dist relative to the crate's manifest directory
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let ui_dist_path = Path::new(manifest_dir).join("../../ui/dist");

    // Create the directory if it doesn't exist
    if !ui_dist_path.exists() {
        println!("cargo:warning=ui/dist directory does not exist, creating it with minimal content");
        std::fs::create_dir_all(&ui_dist_path).expect("Failed to create ui/dist directory");

        // Create a minimal index.html if it doesn't exist
        let index_html = ui_dist_path.join("index.html");
        if !index_html.exists() {
            std::fs::write(&index_html, r#"<!DOCTYPE html>
<html>
<head>
    <title>Kellnr</title>
</head>
<body>
    <h1>UI not built</h1>
    <p>Please run 'npm run build' in the ui directory first.</p>
</body>
</html>"#).expect("Failed to create index.html");
        }
    }

    // Tell cargo to rerun this build script if the ui/dist directory changes
    println!("cargo:rerun-if-changed={}", ui_dist_path.display());
}

