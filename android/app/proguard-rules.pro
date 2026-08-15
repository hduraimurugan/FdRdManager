# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# WorkManager / Room (pulled in transitively by @notifee/react-native for
# scheduled/trigger notifications). WorkManager persists its work queue in a
# Room database, and Room instantiates its generated "<Database>_Impl"/DAO
# classes via reflection by name. Without these keep rules, R8 strips or
# renames those generated classes in release builds, which crashes app
# startup with: "Failed to create an instance of class androidx.work.impl.WorkDatabase".
-keep class androidx.work.** { *; }
-keep class androidx.room.** { *; }
-dontwarn androidx.work.**
-dontwarn androidx.room.**
