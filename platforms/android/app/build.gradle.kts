plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.floristai.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.floristai.app"
        minSdk = 29
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
}

// Aplikacja ma jedno zrodlo prawdy: florist/app/index.html.
// Kopia w assets jest generowana przy kazdym budowaniu (i nie jest trzymana w gicie).
val syncFloristApp by tasks.registering(Copy::class) {
    from(rootProject.file("../../app/index.html"))
    into(layout.projectDirectory.dir("src/main/assets"))
}

tasks.named("preBuild") {
    dependsOn(syncFloristApp)
}
