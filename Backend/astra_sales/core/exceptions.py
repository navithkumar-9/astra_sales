from rest_framework.views import exception_handler
from core.response import error_response


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        errors = response.data
        message = "An error occurred."
        if isinstance(errors, dict):
            if "detail" in errors:
                message = errors["detail"]
                # Keep detail inside standard dict or remove it
            elif "non_field_errors" in errors:
                message = errors["non_field_errors"][0]
        elif isinstance(errors, list):
            message = errors[0]

        return error_response(
            message=message,
            errors=errors,
            status_code=response.status_code
        )

    # For unhandled exceptions, return a standard 500 JSON response
    import logging
    logger = logging.getLogger(__name__)
    logger.exception("Unhandled server exception: %s", str(exc))

    return error_response(
        message="Internal Server Error",
        status_code=500
    )
