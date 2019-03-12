#!/usr/bin/env bash

set -eu -o pipefail
# -e: exits if a command fails
# -u: errors if an variable is referenced before being set
# -o pipefail: causes a pipeline to produce a failure return code if any command errors

readonly PACKAGES=${@:?"No package names specified"}

readonly RULES_NODEJS_DIR=$(cd $(dirname "$0")/..; pwd)
readonly PACKAGES_DIR="${RULES_NODEJS_DIR}/packages"

echo_and_run() { echo "+ $@" ; "$@" ; }

for package in ${PACKAGES[@]} ; do
  (
    # Clean package
    cd "${PACKAGES_DIR}/${package}"
    printf "\n\nCleaning package ${package}\n"
    echo_and_run bazel clean --expunge
    echo_and_run rm -rf node_modules
  )
done
