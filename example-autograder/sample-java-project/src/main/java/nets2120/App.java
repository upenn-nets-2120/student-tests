package nets2120;

// TODO: Add import for Spark
import static spark.Spark.*;

/**
 * Simplest Server
 *
 */
public class App {
    public static void main(String[] args) {
        // TODO: add get request handler
        get("/", (req, res) -> "Hello World");
    }
}
