import SwiftUI

struct ContentView: View {
    @State private var extensionEnabled = false

    var body: some View {
        ZStack {
            Color(red: 0.1, green: 0.1, blue: 0.18)
                .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 8) {
                        Image(systemName: "shield.checkered")
                            .font(.system(size: 56))
                            .foregroundColor(Color(red: 0.91, green: 0.27, blue: 0.38))

                        Text("Cookie Refuser")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.white)

                        Text("Automatically denies cookie consent banners in Safari")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 40)

                    // Setup instructions
                    VStack(alignment: .leading, spacing: 16) {
                        Label("How to Enable", systemImage: "gear")
                            .font(.headline)
                            .foregroundColor(.white)

                        SetupStepView(
                            number: 1,
                            text: "Open the Settings app"
                        )
                        SetupStepView(
                            number: 2,
                            text: "Navigate to Safari > Extensions"
                        )
                        SetupStepView(
                            number: 3,
                            text: "Enable Cookie Refuser"
                        )
                        SetupStepView(
                            number: 4,
                            text: "Tap \"Allow\" for all websites or choose specific sites"
                        )
                    }
                    .padding(20)
                    .background(Color(red: 0.086, green: 0.129, blue: 0.243))
                    .cornerRadius(12)

                    // Open Settings button
                    Button(action: openSettings) {
                        HStack {
                            Image(systemName: "safari")
                            Text("Open Safari Settings")
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(red: 0.91, green: 0.27, blue: 0.38))
                        .cornerRadius(12)
                    }

                    // Features
                    VStack(alignment: .leading, spacing: 16) {
                        Label("Features", systemImage: "star")
                            .font(.headline)
                            .foregroundColor(.white)

                        FeatureRow(
                            icon: "hand.raised",
                            title: "Auto-Deny Cookies",
                            description: "Clicks reject/deny buttons automatically"
                        )
                        FeatureRow(
                            icon: "globe",
                            title: "Multilingual",
                            description: "Supports 9 languages including English, German, French, and more"
                        )
                        FeatureRow(
                            icon: "puzzlepiece.extension",
                            title: "Wide Platform Support",
                            description: "Works with OneTrust, Cookiebot, Quantcast, and many more"
                        )
                        FeatureRow(
                            icon: "eye.slash",
                            title: "Privacy First",
                            description: "No data collection — runs entirely on your device"
                        )
                    }
                    .padding(20)
                    .background(Color(red: 0.086, green: 0.129, blue: 0.243))
                    .cornerRadius(12)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 40)
            }
        }
    }

    private func openSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
        }
    }
}

struct SetupStepView: View {
    let number: Int
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(number)")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .frame(width: 24, height: 24)
                .background(Color(red: 0.91, green: 0.27, blue: 0.38))
                .clipShape(Circle())

            Text(text)
                .font(.subheadline)
                .foregroundColor(.gray)
        }
    }
}

struct FeatureRow: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(Color(red: 0.91, green: 0.27, blue: 0.38))
                .frame(width: 28)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)

                Text(description)
                    .font(.caption)
                    .foregroundColor(.gray)
            }
        }
    }
}

#Preview {
    ContentView()
}
