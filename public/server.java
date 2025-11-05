import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;


public class server {
    
    private static final int PORT = 8000;
    private static final String WEB_ROOT = "public"; // カレントディレクトリ
    
    public static void main(String[] args) throws IOException {
        // HTTPサーバーを作成
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        
        // ルートハンドラーを設定
        server.createContext("/", new FileHandler());
        
        // デフォルトのエグゼキューターを使用
        server.setExecutor(null);
        
        // サーバー起動
        server.start();
        
        System.out.println(repeat('=', 50));
        System.out.println(" My Portal WorkSpace Server Started!");
        System.out.println(repeat('=', 50));
        System.out.println(" URL: http://localhost:" + PORT);
        System.out.println(" Root: " + new File(WEB_ROOT).getAbsolutePath());
        System.out.println(" Stop: Ctrl+C");
        System.out.println(repeat('=', 50));
    }
    
    // Java 8互換のrepeatヘルパー
    private static String repeat(char c, int count) {
        if (count <= 0) return "";
        char[] arr = new char[count];
        for (int i = 0; i < count; i++) arr[i] = c;
        return new String(arr);
    }
    
    /**
     * ファイルリクエストを処理するハンドラー
     */
    static class FileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String requestPath = exchange.getRequestURI().getPath();
            
            // ログ出力
            System.out.println(" Request: " + requestPath);
            
            // ルートの場合はindex.htmlにリダイレクト
            if (requestPath.equals("/")) {
                requestPath = "/index.html";
            }
            
            // ファイルパスを取得
            Path filePath = Paths.get(WEB_ROOT + requestPath).normalize();
            File file = filePath.toFile();
            
            // ファイルが存在するか確認
            if (file.exists() && file.isFile()) {
                // ファイルを読み込み
                byte[] fileBytes = Files.readAllBytes(filePath);
                
                // Content-Typeを設定
                String contentType = getContentType(requestPath);
                exchange.getResponseHeaders().set("Content-Type", contentType);
                
                // CORSヘッダーを追加（開発用）
                exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
                
                // レスポンスを送信
                exchange.sendResponseHeaders(200, fileBytes.length);
                OutputStream os = exchange.getResponseBody();
                os.write(fileBytes);
                os.close();
                
                System.out.println(" Sent: " + requestPath + " (" + fileBytes.length + " bytes)");
            } else {
                // 404エラー
                String response = "404 Not Found: " + requestPath;
                exchange.sendResponseHeaders(404, response.length());
                OutputStream os = exchange.getResponseBody();
                os.write(response.getBytes());
                os.close();
                
                System.out.println(" Not Found: " + requestPath);
            }
        }
        
        /**
         * ファイル拡張子からContent-Typeを取得
         */
        private String getContentType(String path) {
            if (path.endsWith(".html")) return "text/html; charset=UTF-8";
            if (path.endsWith(".css")) return "text/css; charset=UTF-8";
            if (path.endsWith(".js")) return "application/javascript; charset=UTF-8";
            if (path.endsWith(".json")) return "application/json; charset=UTF-8";
            if (path.endsWith(".png")) return "image/png";
            if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
            if (path.endsWith(".gif")) return "image/gif";
            if (path.endsWith(".svg")) return "image/svg+xml";
            if (path.endsWith(".ico")) return "image/x-icon";
            if (path.endsWith(".woff")) return "font/woff";
            if (path.endsWith(".woff2")) return "font/woff2";
            if (path.endsWith(".ttf")) return "font/ttf";
            return "text/plain; charset=UTF-8";
        }
    }
}