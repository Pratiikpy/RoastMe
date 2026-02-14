// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract RoastNFT is ERC721 {
    using Strings for uint256;

    uint256 private _nextTokenId;

    struct RoastData {
        string roastText;
        string targetUsername;
        string senderUsername;
        string theme;
        uint256 reactions;
        uint256 mintedAt;
    }

    mapping(uint256 => RoastData) public roasts;
    mapping(bytes32 => bool) public mintedRoasts;

    event RoastMinted(
        uint256 indexed tokenId,
        address indexed minter,
        string targetUsername,
        string senderUsername
    );

    constructor() ERC721("Onchain Roast", "ROAST") {}

    function mintRoast(
        string calldata roastId,
        string calldata roastText,
        string calldata targetUsername,
        string calldata senderUsername,
        string calldata theme,
        uint256 reactions
    ) external returns (uint256) {
        // Prevent double-minting the same roast
        bytes32 roastHash = keccak256(abi.encodePacked(roastId));
        require(!mintedRoasts[roastHash], "Roast already minted");
        mintedRoasts[roastHash] = true;

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        roasts[tokenId] = RoastData({
            roastText: roastText,
            targetUsername: targetUsername,
            senderUsername: senderUsername,
            theme: theme,
            reactions: reactions,
            mintedAt: block.timestamp
        });

        emit RoastMinted(tokenId, msg.sender, targetUsername, senderUsername);
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        RoastData memory data = roasts[tokenId];

        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
            '<defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#0a0a0f"/><stop offset="100%" style="stop-color:#1a0a0a"/>',
            '</linearGradient></defs>',
            '<rect width="400" height="400" fill="url(#bg)" rx="20"/>',
            '<text x="200" y="40" text-anchor="middle" fill="#f97316" font-size="20" font-weight="bold">ONCHAIN ROAST</text>',
            '<text x="200" y="70" text-anchor="middle" fill="#fed7aa" font-size="12">@', data.targetUsername, '</text>',
            '<foreignObject x="20" y="90" width="360" height="240">',
            '<div xmlns="http://www.w3.org/1999/xhtml" style="color:#fff7ed;font-size:14px;line-height:1.5;word-wrap:break-word;overflow:hidden;">',
            data.roastText,
            '</div></foreignObject>',
            '<text x="200" y="360" text-anchor="middle" fill="#9a3412" font-size="10">by @', data.senderUsername,
            ' | ', data.reactions.toString(), ' reactions</text>',
            '<text x="200" y="385" text-anchor="middle" fill="#9a3412" font-size="9">Minted on Base</text>',
            '</svg>'
        ));

        string memory json = string(abi.encodePacked(
            '{"name":"Onchain Roast #', tokenId.toString(),
            '","description":"An AI-generated roast of @', data.targetUsername,
            ', minted on Base.","image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(svg)),
            '","attributes":[{"trait_type":"Theme","value":"', data.theme,
            '"},{"trait_type":"Reactions","display_type":"number","value":', data.reactions.toString(),
            '},{"trait_type":"Target","value":"@', data.targetUsername,
            '"},{"trait_type":"Roaster","value":"@', data.senderUsername,
            '"}]}'
        ));

        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }
}
