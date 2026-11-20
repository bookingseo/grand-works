# Grand Works trên điện thoại

Hai ứng dụng lấy toàn bộ trò đã bật `publish` từ `node studio.mjs build`. Khởi động mở Ca Luyện Thép. Chạm tên xưởng để đổi game. Ca sản xuất và kỷ lục lưu trên thiết bị. Android dùng WebView tích hợp trên máy và iOS dùng WebKit.

## Android

Cần Node 22+, Python 3, JDK 17+ và Android SDK với `platforms;android-36` và `build-tools;36.0.0`. Đặt `ANDROID_HOME` và `JAVA_HOME` rồi chạy `python3 mobile/android/build.py`. Lệnh này tự ký bản phát triển bằng khóa cục bộ trong `.mobile-signing/` và xuất `out/mobile/Grand-Works-dev.apk`. Để ký một bản phát hành, đặt `GRAND_WORKS_KEYSTORE` trỏ đến kho khóa và cấp `GRAND_WORKS_STORE_PASS` qua môi trường. Giữ khóa này để ký các bản cập nhật. APK chạy trên Android 9+ với Android System WebView cập nhật.

## iPhone và iPad

Trên Mac có Xcode, XcodeGen và Node 22+, chạy `mobile/ios/prepare.sh`, rồi mở `mobile/ios/GrandWorks.xcodeproj`. Chọn scheme `GrandWorks` và Run trên iPhone Simulator. Để cài vào iPhone thật, chọn Team ký ứng dụng trong Signing & Capabilities. Chạy lại `prepare.sh` sau khi sửa game để đồng bộ tài nguyên vào app.

Bài UI test của scheme `GrandWorks` chơi đơn quặng bằng thao tác chạm, đóng mở lại app để kiểm tra ca đã lưu và thử Cầu Trục Ca Đêm.
