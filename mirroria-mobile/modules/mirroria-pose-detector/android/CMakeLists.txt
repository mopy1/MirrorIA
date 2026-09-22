project(mirroriaposedetector)
cmake_minimum_required(VERSION 3.9.0)

set(PACKAGE_NAME mirroriaposedetector)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

# Define C++ library and add all sources
add_library(${PACKAGE_NAME} SHARED src/main/cpp/cpp-adapter.cpp)

# Add Nitrogen specs :)
include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/mirroriaposedetector+autolinking.cmake)

# Set up local includes
include_directories("src/main/cpp" "../cpp")

find_library(LOG_LIB log)

# Link all libraries together
target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}
        android # <-- Android core
)

# HybridFrameSpec (el tipo Frame que llega a processFrameAndroid) vive en el
# módulo Nitro de react-native-vision-camera, no en el nuestro — hace falta
# linkear su paquete prefab explícitamente para que el header exista.
find_package(react-native-vision-camera REQUIRED CONFIG)

target_link_libraries(
    ${PACKAGE_NAME}
    react-native-vision-camera::VisionCamera
)
