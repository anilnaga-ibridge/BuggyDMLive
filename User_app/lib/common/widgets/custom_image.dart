import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:sixam_mart/util/app_constants.dart';
import 'package:sixam_mart/util/images.dart';

class CustomImage extends StatelessWidget {
  final String image;
  final double? height;
  final double? width;
  final BoxFit? fit;
  final bool isNotification;
  final String placeholder;
  final bool isHovered;
  final Color? color;
  final int? cacheWidth;
  final int? cacheHeight;
  const CustomImage({super.key,
    required this.image, this.height, this.width, this.fit = BoxFit.cover, this.isNotification = false,
    this.placeholder = '', this.isHovered = false, this.color, this.cacheWidth, this.cacheHeight,
  });

  @override
  Widget build(BuildContext context) {
    if (image.trim().isEmpty) {
      return Image.asset(
        placeholder.isNotEmpty ? placeholder : (isNotification ? Images.notificationPlaceholder : Images.placeholder),
        height: height, width: width, fit: fit, color: color,
      );
    }

    final bool isLocalOrDirect = image.contains(AppConstants.baseUrl) ||
        image.contains('127.0.0.1') ||
        image.contains('localhost') ||
        !image.startsWith('http');

    final String finalUrl = (!isLocalOrDirect && kIsWeb)
        ? '${AppConstants.baseUrl}/image-proxy?url=${Uri.encodeComponent(image)}'
        : image;

    return AnimatedScale(
      scale: isHovered ? 1.1 : 1.0,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
      child: CachedNetworkImage(
        color: color,
        imageUrl: finalUrl, height: height, width: width, fit: fit,
        memCacheWidth: cacheWidth ?? (width != null && width!.isFinite && width! > 0 ? (width! * 2).toInt() : 400),
        memCacheHeight: cacheHeight ?? (height != null && height!.isFinite && height! > 0 ? (height! * 2).toInt() : 400),
        placeholder: (context, url) => Image.asset(
          placeholder.isNotEmpty ? placeholder : (isNotification ? Images.notificationPlaceholder : Images.placeholder),
          height: height, width: width, fit: fit, color: color,
        ),
        errorWidget: (context, url, error) => Image.asset(
          placeholder.isNotEmpty ? placeholder : (isNotification ? Images.notificationPlaceholder : Images.placeholder),
          height: height, width: width, fit: fit, color: color,
        ),
      ),
    );
  }
}
