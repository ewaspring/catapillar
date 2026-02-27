plugins {
    id("java")
    id("org.jetbrains.kotlin.jvm") version "1.9.22"
    id("org.jetbrains.intellij.platform") version "2.11.0"
}

group = "lang.catapillar"
version = "0.1.0"

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

// Target bytecode 17 so plugin runs on IntelliJ 2023.3 JBR (17); build can use host JDK 21
java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}
kotlin {
    jvmToolchain(21)
}
tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
    kotlinOptions.jvmTarget = "17"
}

dependencies {
    intellijPlatform {
        // 2024.1+ often avoids SIGABRT in runIde on Linux (Compose/native); plugin still targets 232+
        intellijIdea("2024.1")
    }
}

intellijPlatform {
    pluginConfiguration {
        name = "Catapillar"
        version = project.version.toString()
        description = "Language support for Catapillar (.cat files): syntax highlighting, completion, hover, " +
            "document symbols, formatting, and run/debug. Works in IntelliJ IDEA and PyCharm."
        ideaVersion {
            sinceBuild = "232"
        }
    }
}

val runtimeSourceDir = file("${project.projectDir}/runtime")

tasks {
    patchPluginXml {
        sinceBuild.set("232")
    }
    // Avoid runIde crashes: disable Compose Hot Reload agent; add JVM stability args (SIGABRT 134 on some Linux)
    named<org.jetbrains.intellij.platform.gradle.tasks.RunIdeTask>("runIde").configure {
        composeHotReload.set(false)
        jvmArgs(
            "-Dcompose.reload.agent.disabled=true",
            "-XX:+UseG1GC",
            "-XX:SoftRefLRUPolicyMSPerMB=50",
        )
    }
    // Bundle Catapillar runtime in the plugin (like extension/catapillar-runtime in VS Code)
    named<org.gradle.api.tasks.bundling.Zip>("buildPlugin").configure {
        if (runtimeSourceDir.exists()) {
            from(runtimeSourceDir) {
                into("runtime")
                exclude("**/__pycache__/**", "**/*.pyc")
            }
        }
    }
}
