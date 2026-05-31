use crate::models::CadCommand;

/// Starter command library, written to commands.json on first run.
/// Fully editable from the in-app Command Library screen.
pub fn seed_commands() -> Vec<CadCommand> {
    let autocad: &[(&str, &str)] = &[
        ("LINE", "Draw straight line segments"),
        ("PLINE", "Draw a 2D polyline"),
        ("CIRCLE", "Draw a circle"),
        ("ARC", "Draw an arc"),
        ("RECTANG", "Draw a rectangle"),
        ("POLYGON", "Draw an equilateral polygon"),
        ("ELLIPSE", "Draw an ellipse"),
        ("SPLINE", "Draw a spline curve"),
        ("COPY", "Copy objects"),
        ("MOVE", "Move objects"),
        ("ROTATE", "Rotate objects"),
        ("SCALE", "Scale objects"),
        ("MIRROR", "Mirror objects"),
        ("OFFSET", "Offset objects at a distance"),
        ("TRIM", "Trim objects to edges"),
        ("EXTEND", "Extend objects to boundaries"),
        ("FILLET", "Round or fillet edges"),
        ("CHAMFER", "Bevel edges"),
        ("ARRAY", "Create a pattern of objects"),
        ("STRETCH", "Stretch objects"),
        ("ERASE", "Delete objects"),
        ("EXPLODE", "Break compound objects into parts"),
        ("JOIN", "Join similar objects"),
        ("BREAK", "Break an object between two points"),
        ("HATCH", "Fill an area with a pattern"),
        ("TEXT", "Create single-line text"),
        ("MTEXT", "Create multiline text"),
        ("DIMLINEAR", "Linear dimension"),
        ("DIMALIGNED", "Aligned dimension"),
        ("DIMANGULAR", "Angular dimension"),
        ("DIMRADIUS", "Radius dimension"),
        ("LAYER", "Manage layers"),
        ("MATCHPROP", "Match properties between objects"),
        ("BLOCK", "Create a block definition"),
        ("INSERT", "Insert a block"),
        ("WIPEOUT", "Create a wipeout area"),
        ("ZOOM", "Zoom the view"),
        ("PAN", "Pan the view"),
        ("REGEN", "Regenerate the drawing"),
        ("PURGE", "Remove unused items"),
        ("DIST", "Measure distance"),
        ("AREA", "Measure area"),
        ("LIST", "List object data"),
        ("OSNAP", "Object snap settings"),
        ("UNITS", "Drawing units"),
        ("PLOT", "Plot / print the drawing"),
    ];

    let mut out: Vec<CadCommand> = autocad
        .iter()
        .map(|(name, desc)| CadCommand {
            id: uuid::Uuid::new_v4().to_string(),
            name: name.to_string(),
            source: "autocad".to_string(),
            description: desc.to_string(),
            aliases: Vec::new(),
        })
        .collect();

    // Placeholder entries demonstrating the other sources. Edit or delete these
    // from the Command Library screen and add your real BaCAD commands.
    out.push(CadCommand {
        id: uuid::Uuid::new_v4().to_string(),
        name: "BACAD".to_string(),
        source: "bacad".to_string(),
        description: "Example BaCAD command - replace with your own".to_string(),
        aliases: Vec::new(),
    });
    out.push(CadCommand {
        id: uuid::Uuid::new_v4().to_string(),
        name: "MYBLOCK".to_string(),
        source: "custom".to_string(),
        description: "Example custom command - edit or remove".to_string(),
        aliases: Vec::new(),
    });

    out
}
